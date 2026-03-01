import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { callClaude, checkRateLimit, logAIUsage, getContextPrompt } from '@/lib/ai'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const db = createDataServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const allowed = await checkRateLimit(db, user.id, 'analyze')
  if (!allowed) return NextResponse.json({ error: '分析回数の上限に達しました' }, { status: 429 })

  const body = await request.json().catch(() => ({}))
  const categories: string[] = body.categories || ['seo', 'content_freshness', 'internal_links', 'readability']
  const postIds: string[] | undefined = body.post_ids

  // Create analysis run
  const { data: run } = await db
    .from('blog_analysis_runs')
    .insert({ user_id: user.id, categories, status: 'running' })
    .select('id')
    .single()

  if (!run) return NextResponse.json({ error: '分析の開始に失敗しました' }, { status: 500 })

  // Get published posts
  let query = db
    .from('blog_posts')
    .select('id, title, slug, content_html, excerpt, meta_description, status, published_at, updated_at')
    .eq('user_id', user.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20)

  if (postIds && postIds.length > 0) {
    query = query.in('id', postIds)
  }

  const { data: posts } = await query
  if (!posts || posts.length === 0) {
    await db.from('blog_analysis_runs').update({
      status: 'completed', completed_at: new Date().toISOString(),
      posts_analyzed: 0, suggestions_created: 0,
    }).eq('id', run.id)
    return NextResponse.json({ run_id: run.id, status: 'completed', suggestions_created: 0 })
  }

  // Get existing tags for posts
  const { data: postTags } = await db
    .from('blog_post_tags')
    .select('post_id, blog_tags(name)')
    .in('post_id', posts.map(p => p.id))

  const tagsByPost: Record<string, string[]> = {}
  if (postTags) {
    for (const pt of postTags) {
      if (!tagsByPost[pt.post_id]) tagsByPost[pt.post_id] = []
      const tagName = (pt as any).blog_tags?.name
      if (tagName) tagsByPost[pt.post_id].push(tagName)
    }
  }

  const contextPrompt = await getContextPrompt(db, user.id)

  // Build post list for internal link analysis
  const postList = posts.map(p => `- ${p.title} (/${p.slug})`).join('\n')

  let totalSuggestions = 0

  // Analyze each post
  for (const post of posts) {
    const plainText = (post.content_html || '').replace(/<[^>]*>/g, '').slice(0, 3000)
    const tags = tagsByPost[post.id] || []

    const systemPrompt = `あなたはブログ改善のプロフェッショナルです。ブログ記事を分析し、具体的で実行可能な改善提案をJSON形式で返してください。
${contextPrompt}

分析カテゴリ: ${categories.join(', ')}

## カテゴリ説明
- seo: SEOの改善点（タイトル、メタディスクリプション、見出し構造、キーワード等）
- content_freshness: コンテンツの鮮度（古い情報、更新が必要な箇所）
- internal_links: 内部リンクの提案（他の記事への関連リンク追加）
- readability: 読みやすさ（段落の長さ、見出しの使い方、専門用語の説明等）
- content_gap: カバーされていないトピックの提案
- performance: パフォーマンス改善（文字数、構成等）

## ブログ内の他の記事一覧（内部リンク分析用）
${postList}

## 出力形式（JSONのみ、他のテキストは不要）
{"suggestions":[{"category":"seo","severity":"warning","title":"改善タイトル","description":"具体的な改善方法の説明"}]}`

    const userPrompt = `以下の記事を分析してください。

タイトル: ${post.title}
スラッグ: ${post.slug}
公開日: ${post.published_at || '未公開'}
最終更新: ${post.updated_at}
メタディスクリプション: ${post.meta_description || '（未設定）'}
タグ: ${tags.length > 0 ? tags.join(', ') : '（未設定）'}
抜粋: ${post.excerpt || '（未設定）'}

本文:
${plainText}`

    try {
      const result = await callClaude(systemPrompt, userPrompt, 2048, 'claude-haiku-4-5-20251001')
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        const suggestions = parsed.suggestions || []

        for (const s of suggestions) {
          if (!s.category || !s.severity || !s.title || !s.description) continue
          await db.from('blog_suggestions').insert({
            user_id: user.id,
            post_id: post.id,
            category: s.category,
            severity: s.severity,
            title: s.title,
            description: s.description,
            action_label: s.action_label || null,
            action_data: s.action_data || null,
          })
          totalSuggestions++
        }
      }
    } catch (e) {
      // Continue with next post on error
    }
  }

  await db.from('blog_analysis_runs').update({
    status: 'completed',
    completed_at: new Date().toISOString(),
    posts_analyzed: posts.length,
    suggestions_created: totalSuggestions,
  }).eq('id', run.id)

  await logAIUsage(db, user.id, 'analyze')

  return NextResponse.json({
    run_id: run.id,
    status: 'completed',
    posts_analyzed: posts.length,
    suggestions_created: totalSuggestions,
  })
}
