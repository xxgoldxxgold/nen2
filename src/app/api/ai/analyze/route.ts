import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { callClaude, checkRateLimit, logAIUsage } from '@/lib/ai'
import { buildContextPrompt } from '@/lib/context-notes'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const allowed = await checkRateLimit(db, user.id, 'analyze')
  if (!allowed) return NextResponse.json({ error: 'AI利用回数の上限に達しました' }, { status: 429 })

  // Determine post limit by plan
  const { data: profile } = await db.from('profiles').select('plan').eq('id', user.id).single()
  const plan = profile?.plan || 'free'
  const postLimit = plan === 'free' ? 10 : 999

  // Get published posts
  const { data: posts } = await db
    .from('articles')
    .select('id, title, content, slug, meta_description, seo_score, published_at')
    .eq('user_id', user.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(postLimit)

  if (!posts || posts.length === 0) {
    return NextResponse.json({ error: '公開済みの記事がありません' }, { status: 400 })
  }

  // Create analysis run
  const { data: run } = await db
    .from('nen2_analysis_runs')
    .insert({ user_id: user.id, posts_analyzed: posts.length, suggestions_created: 0 })
    .select()
    .single()

  try {
    // Build article summaries for Claude
    const articleSummaries = posts.map(p =>
      `[ID:${p.id}] タイトル: ${p.title}\nメタ: ${p.meta_description || 'なし'}\nSEOスコア: ${p.seo_score}\n本文(冒頭): ${(p.content || '').slice(0, 1500)}\n---`
    ).join('\n')

    let systemPrompt = `あなたはブログSEO・コンテンツ改善のエキスパートです。
以下のブログ記事群を分析し、具体的な改善提案をJSON形式で出力してください。

## 分析カテゴリ
- seo: SEO関連（メタタグ、キーワード、タイトル最適化等）
- content_freshness: コンテンツの鮮度（更新が必要な古い情報等）
- internal_links: 内部リンク（記事間の相互リンク不足等）
- content_gap: コンテンツギャップ（カバーすべきだが欠けているトピック等）
- readability: 読みやすさ（文章構成、見出し、段落等）
- performance: パフォーマンス（画像最適化等）

## 重要度
- critical: 即座に対応すべき重要な問題
- warning: 対応推奨の改善点
- info: 参考情報・軽微な改善提案

## 出力形式（JSONのみ）
{"suggestions": [{"category": "seo", "severity": "warning", "title": "短い提案タイトル", "description": "具体的な改善内容", "post_id": "該当記事のIDまたはnull"}]}`

    const contextPrompt = await buildContextPrompt(db, user.id)
    if (contextPrompt) systemPrompt += contextPrompt

    const result = await callClaude(
      systemPrompt,
      `以下の${posts.length}件の公開済みブログ記事を分析してください:\n\n${articleSummaries}`,
      4096
    )

    await logAIUsage(db, user.id, 'analyze')

    // Parse suggestions
    const jsonMatch = result.match(/\{[\s\S]*"suggestions"[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Invalid AI response format')

    const parsed = JSON.parse(jsonMatch[0])
    const suggestions = parsed.suggestions || []

    // Clear old open suggestions
    await db
      .from('nen2_blog_suggestions')
      .delete()
      .eq('user_id', user.id)
      .eq('status', 'open')

    // Insert new suggestions
    if (suggestions.length > 0) {
      const rows = suggestions.map((s: any) => ({
        user_id: user.id,
        post_id: s.post_id && s.post_id !== 'null' ? s.post_id : null,
        category: s.category,
        severity: s.severity,
        title: s.title,
        description: s.description,
        action_label: s.action_label || null,
        action_data: s.action_data || null,
      }))
      await db.from('nen2_blog_suggestions').insert(rows)
    }

    // Update run
    await db
      .from('nen2_analysis_runs')
      .update({ status: 'completed', suggestions_created: suggestions.length, completed_at: new Date().toISOString() })
      .eq('id', run.id)

    return NextResponse.json({ suggestions_count: suggestions.length, run_id: run.id })
  } catch (error) {
    console.error('Analysis error:', error)
    if (run) {
      await db
        .from('nen2_analysis_runs')
        .update({ status: 'failed', error_message: String(error), completed_at: new Date().toISOString() })
        .eq('id', run.id)
    }
    return NextResponse.json({ error: '分析に失敗しました' }, { status: 500 })
  }
}
