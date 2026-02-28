import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { renderMarkdown, extractExcerpt } from '@/lib/markdown'
import { callClaude, checkRateLimit, logAIUsage } from '@/lib/ai'
import { NextRequest, NextResponse } from 'next/server'

type RouteContext = { params: Promise<{ id: string }> }

// GET /api/posts/[id]
export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { data, error } = await db
    .from('articles')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) return NextResponse.json({ error: '記事が見つかりません' }, { status: 404 })

  // Also fetch tags
  const { data: postTags } = await db
    .from('article_tags')
    .select('tags(id, name)')
    .eq('article_id', id)

  const tags = postTags?.map((pt: any) => pt.tags?.name).filter(Boolean) || []

  return NextResponse.json({ ...data, tags })
}

// PUT /api/posts/[id]
export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const body = await request.json()
  const { title, content, slug, status, cover_image_url, meta_description, seo_score, tags } = body

  const updateData: Record<string, unknown> = {}
  if (title !== undefined) updateData.title = title
  if (slug !== undefined) updateData.slug = slug
  let excerpt: string | undefined
  if (content !== undefined) {
    updateData.content = content
    updateData.content_html = renderMarkdown(content)
    excerpt = extractExcerpt(content)
    updateData.excerpt = excerpt
  }
  if (status !== undefined) updateData.status = status
  if (cover_image_url !== undefined) updateData.cover_image_url = cover_image_url
  if (seo_score !== undefined) updateData.seo_score = seo_score

  // Auto-generate meta_description from excerpt if empty
  if (meta_description) {
    updateData.meta_description = meta_description
  } else if (meta_description !== undefined && excerpt) {
    updateData.meta_description = excerpt.slice(0, 160)
  }

  // Set published_at when first publishing
  if (status === 'published') {
    const { data: existing } = await db
      .from('articles')
      .select('published_at')
      .eq('id', id)
      .single()
    if (!existing?.published_at) {
      updateData.published_at = new Date().toISOString()
    }
  }

  const { data, error } = await db
    .from('articles')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: '記事が見つかりません' }, { status: 404 })

  // Sync tags — auto-generate via AI if empty
  let finalTags: string[] | null = null
  if (tags !== undefined && Array.isArray(tags)) {
    if (tags.length > 0) {
      finalTags = tags
    } else if (content || data.content) {
      // Tags array is empty — auto-generate
      try {
        const allowed = await checkRateLimit(db, user.id, 'suggest_tags')
        if (allowed) {
          const articleContent = content || data.content || ''
          const articleTitle = title || data.title || ''
          const result = await callClaude(
            'ブログ記事に最適なタグを3〜5個提案。JSON配列のみ出力（例: ["タグ1","タグ2"]）',
            `タイトル: ${articleTitle}\n本文: ${articleContent.slice(0, 2000)}`,
            256
          )
          await logAIUsage(db, user.id, 'suggest_tags')
          const parsed = JSON.parse(result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())
          if (Array.isArray(parsed) && parsed.length > 0) finalTags = parsed
        }
      } catch { /* ignore */ }
    }
    if (finalTags && finalTags.length > 0) {
      const { syncPostTags } = await import('@/lib/tags')
      await syncPostTags(db, id, finalTags)
    }
  }

  return NextResponse.json({ ...data, tags: finalTags || tags || [] })
}

// DELETE /api/posts/[id]
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { error } = await db
    .from('articles')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: true })
}
