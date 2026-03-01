import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { streamClaude, checkRateLimit, logAIUsage } from '@/lib/ai'
import { buildContextPrompt } from '@/lib/context-notes'
import { NextRequest, NextResponse } from 'next/server'

const languageNames: Record<string, string> = {
  ja: '日本語',
  en: 'English',
  zh: '中文(简体)',
  'zh-tw': '中文(繁體)',
  ko: '韓国語',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
}

type RouteContext = { params: Promise<{ id: string }> }

// POST /api/posts/[id]/translate — translate to a language (streaming)
export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const allowed = await checkRateLimit(db, user.id, 'translate')
  if (!allowed) return NextResponse.json({ error: 'AI利用回数の上限に達しました' }, { status: 429 })

  const { language } = await request.json()
  if (!language || !languageNames[language]) {
    return NextResponse.json({ error: '無効な言語コードです' }, { status: 400 })
  }

  const { data: post } = await db.from('articles').select('*').eq('id', id).eq('user_id', user.id).single()
  if (!post) return NextResponse.json({ error: '記事が見つかりません' }, { status: 404 })

  const targetLang = languageNames[language]

  let systemPrompt = `あなたはプロの翻訳者です。ブログ記事を${targetLang}に翻訳してください。

## ルール
- 自然で読みやすい${targetLang}に翻訳する（機械翻訳っぽくならないように）
- Markdown形式を維持する
- 見出し、リスト、コードブロック等の構造はそのまま保持
- 固有名詞は原語のまま残してよい
- 最初の行に翻訳されたタイトルを ## で出力
- 2行目に翻訳されたメタディスクリプション(160文字以内)を <!-- meta: ... --> で出力
- 3行目以降に本文の翻訳を出力`

  const contextPrompt = await buildContextPrompt(db, user.id)
  if (contextPrompt) systemPrompt += contextPrompt

  const userPrompt = `以下のブログ記事を${targetLang}に翻訳してください。

タイトル: ${post.title}
メタディスクリプション: ${post.meta_description || ''}

本文:
${post.content || ''}`

  try {
    const stream = streamClaude(systemPrompt, userPrompt, 8192, 'claude-sonnet-4-6')

    const encoder = new TextEncoder()
    let fullText = ''

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && (event as any).delta?.type === 'text_delta') {
              const text = (event as any).delta.text
              fullText += text
              controller.enqueue(encoder.encode(text))
            }
          }
          controller.close()

          // Parse translated content and save
          await logAIUsage(db, user.id, 'translate')

          let translatedTitle = post.title
          let translatedMeta = ''
          let translatedContent = fullText

          // Extract title from first ## line
          const titleMatch = fullText.match(/^## (.+)/m)
          if (titleMatch) {
            translatedTitle = titleMatch[1].trim()
            translatedContent = fullText.replace(/^## .+\n?/, '').trim()
          }

          // Extract meta from <!-- meta: ... -->
          const metaMatch = translatedContent.match(/<!--\s*meta:\s*(.+?)\s*-->/)
          if (metaMatch) {
            translatedMeta = metaMatch[1].trim()
            translatedContent = translatedContent.replace(/<!--\s*meta:\s*.+?\s*-->\n?/, '').trim()
          }

          // Upsert translation
          const { data: existing } = await db
            .from('nen2_post_translations')
            .select('id')
            .eq('post_id', id)
            .eq('language_code', language)
            .single()

          if (existing) {
            await db
              .from('nen2_post_translations')
              .update({
                title: translatedTitle,
                content: translatedContent,
                meta_description: translatedMeta || null,
                status: 'draft',
                updated_at: new Date().toISOString(),
              })
              .eq('id', existing.id)
          } else {
            await db
              .from('nen2_post_translations')
              .insert({
                post_id: id,
                language_code: language,
                title: translatedTitle,
                content: translatedContent,
                meta_description: translatedMeta || null,
                status: 'draft',
              })
          }
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json({ error: '翻訳に失敗しました' }, { status: 500 })
  }
}
