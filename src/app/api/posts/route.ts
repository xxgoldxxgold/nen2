import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { renderMarkdown, extractExcerpt } from '@/lib/markdown'
import { slugify } from '@/lib/utils'
import { validateUsername } from '@/lib/reserved-usernames'
import { callClaude, checkRateLimit, logAIUsage } from '@/lib/ai'
import { NextResponse } from 'next/server'

// GET /api/posts — list user's posts
export async function GET() {
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { data, error } = await db
    .from('articles')
    .select('id, title, slug, excerpt, status, seo_score, published_at, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/posts — create a new post
export async function POST(request: Request) {
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  // Auto-provision profile if not exists (with auth ID migration)
  let { data: profile } = await db.from('profiles').select('id').eq('id', user.id).single()
  if (!profile && user.email) {
    const { data: existing } = await db.from('profiles').select('id').eq('email', user.email).single()
    if (existing) {
      const oldId = existing.id
      await db.from('articles').update({ user_id: user.id }).eq('user_id', oldId)
      await db.from('ai_usage_logs').update({ user_id: user.id }).eq('user_id', oldId)
      await db.from('profiles').update({ id: user.id }).eq('id', oldId)
      profile = { id: user.id }
    }
  }
  if (!profile) {
    let username = user.user_metadata?.username || user.email?.split('@')[0]?.replace(/[^a-z0-9_-]/gi, '').toLowerCase() || ''
    if (validateUsername(username) !== null) {
      username = 'user-' + user.id.slice(0, 8)
    }
    await db.from('profiles').insert({
      id: user.id,
      email: user.email,
      username,
      display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
    })
    profile = { id: user.id }
  }

  const body = await request.json()
  const { title, content, status, cover_image_url, meta_description, tags } = body

  if (!title) return NextResponse.json({ error: 'タイトルは必須です' }, { status: 400 })

  // Generate unique slug
  let slug = slugify(title)
  const { data: existing } = await db
    .from('articles')
    .select('slug')
    .eq('user_id', user.id)
    .like('slug', `${slug}%`)
  if (existing && existing.length > 0) {
    const usedSlugs = new Set(existing.map((p: any) => p.slug))
    if (usedSlugs.has(slug)) {
      let i = 2
      while (usedSlugs.has(`${slug}-${i}`)) i++
      slug = `${slug}-${i}`
    }
  }
  const content_html = content ? renderMarkdown(content) : ''
  const excerpt = content ? extractExcerpt(content) : ''

  // Auto-generate meta_description from excerpt if not provided
  const finalMetaDescription = meta_description || (excerpt ? excerpt.slice(0, 160) : null)

  const postData: Record<string, unknown> = {
    user_id: user.id,
    title,
    slug,
    content,
    content_html,
    excerpt,
    cover_image_url: cover_image_url || null,
    meta_description: finalMetaDescription,
    status: status || 'draft',
  }

  if (status === 'published') {
    postData.published_at = new Date().toISOString()
  }

  const { data, error } = await db
    .from('articles')
    .insert(postData)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sync tags — auto-generate via AI if none provided
  let finalTags = tags && Array.isArray(tags) && tags.length > 0 ? tags : null
  if (!finalTags && content) {
    try {
      const allowed = await checkRateLimit(db, user.id, 'suggest_tags')
      if (allowed) {
        const result = await callClaude(
          'ブログ記事に最適なタグを3〜5個提案。JSON配列のみ出力（例: ["タグ1","タグ2"]）',
          `タイトル: ${title}\n本文: ${content.slice(0, 2000)}`,
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
    await syncPostTags(db, data.id, finalTags)
  }

  return NextResponse.json({ ...data, meta_description: finalMetaDescription, tags: finalTags || [] }, { status: 201 })
}
