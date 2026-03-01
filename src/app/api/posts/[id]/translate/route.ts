import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { callClaude, checkRateLimit, logAIUsage, getContextPrompt } from '@/lib/ai'
import { NextResponse } from 'next/server'

const LANGUAGES: Record<string, string> = {
  en: 'English',
  zh: '中文（簡体）',
  'zh-tw': '中文（繁體）',
  ko: '한국어',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const db = createDataServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { id: postId } = await params
  const body = await request.json()
  const languages: string[] = body.languages || []
  const forceRetranslate = body.force_retranslate || false

  if (languages.length === 0) {
    return NextResponse.json({ error: '翻訳先言語を指定してください' }, { status: 400 })
  }

  const invalidLangs = languages.filter(l => !LANGUAGES[l])
  if (invalidLangs.length > 0) {
    return NextResponse.json({ error: `未対応の言語: ${invalidLangs.join(', ')}` }, { status: 400 })
  }

  // Verify post ownership
  const { data: post } = await db
    .from('blog_posts')
    .select('id, user_id, title, content_html, excerpt, meta_description')
    .eq('id', postId)
    .single()

  if (!post || post.user_id !== user.id) {
    return NextResponse.json({ error: '記事が見つかりません' }, { status: 404 })
  }

  // Check rate limit for each translation
  for (const lang of languages) {
    const allowed = await checkRateLimit(db, user.id, 'translate')
    if (!allowed) {
      return NextResponse.json({ error: `翻訳回数の上限に達しました（${lang}）` }, { status: 429 })
    }
  }

  // Get current version number
  const { data: latestVersion } = await db
    .from('blog_post_versions')
    .select('version_number')
    .eq('post_id', postId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single()

  const versionNumber = latestVersion?.version_number || 0
  const contextPrompt = await getContextPrompt(db, user.id)
  const plainText = (post.content_html || '').replace(/<[^>]*>/g, '').slice(0, 5000)

  const results: Record<string, { status: string; translation_id?: string }> = {}

  for (const lang of languages) {
    // Check if translation already exists
    if (!forceRetranslate) {
      const { data: existing } = await db
        .from('blog_post_translations')
        .select('id, status')
        .eq('post_id', postId)
        .eq('language_code', lang)
        .single()

      if (existing && existing.status !== 'needs_update') {
        results[lang] = { status: 'already_exists', translation_id: existing.id }
        continue
      }
    }

    const targetLang = LANGUAGES[lang]

    const systemPrompt = `あなたはプロの翻訳者です。以下のブログ記事を${targetLang}に翻訳してください。

## ルール
- 自然な${targetLang}の表現にする（直訳ではなく意訳）
- 技術用語は一般的に使われる${targetLang}の表記に従う
- 固有名詞（人名、サービス名、会社名）はそのまま維持
- HTMLタグの構造を維持する（<h2>, <p>, <ul>, <li>, <code>等のタグはそのまま残す）
- SEO的に重要なキーワードは${targetLang}で一般的に検索される表現を使用
- 文化的なニュアンスが異なる表現は、${targetLang}の読者に適した表現に変換
${contextPrompt}

## 出力形式（JSONのみ返してください）
{"title":"翻訳されたタイトル","content_html":"翻訳されたHTML本文","excerpt":"翻訳された抜粋","meta_description":"翻訳されたメタディスクリプション"}`

    const userPrompt = `タイトル: ${post.title}
抜粋: ${post.excerpt || '（なし）'}
メタディスクリプション: ${post.meta_description || '（なし）'}

本文HTML:
${post.content_html || ''}`

    try {
      const result = await callClaude(systemPrompt, userPrompt, 4096)
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        results[lang] = { status: 'failed' }
        continue
      }

      const translated = JSON.parse(jsonMatch[0])

      // Upsert translation
      const { data: upserted } = await db
        .from('blog_post_translations')
        .upsert({
          post_id: postId,
          user_id: user.id,
          language_code: lang,
          title: translated.title || post.title,
          content_html: translated.content_html || '',
          excerpt: translated.excerpt || null,
          meta_description: translated.meta_description || null,
          status: 'draft',
          translated_from_version: versionNumber,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'post_id,language_code' })
        .select('id')
        .single()

      await logAIUsage(db, user.id, 'translate')
      results[lang] = { status: 'completed', translation_id: upserted?.id }
    } catch {
      results[lang] = { status: 'failed' }
    }
  }

  return NextResponse.json({ translations: results })
}
