import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const db = createDataServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const url = new URL(request.url)
  const status = url.searchParams.get('status') || 'open'
  const category = url.searchParams.get('category')
  const severity = url.searchParams.get('severity')
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
  const offset = parseInt(url.searchParams.get('offset') || '0')

  let query = db
    .from('blog_suggestions')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status !== 'all') {
    query = query.eq('status', status)
  }
  if (category) {
    query = query.eq('category', category)
  }
  if (severity) {
    query = query.eq('severity', severity)
  }

  const { data: suggestions, count } = await query

  // Get post titles for suggestions with post_id
  let enriched = suggestions || []
  const postIds = [...new Set(enriched.filter(s => s.post_id).map(s => s.post_id))]
  if (postIds.length > 0) {
    const { data: posts } = await db
      .from('blog_posts')
      .select('id, title')
      .in('id', postIds)

    if (posts) {
      const postMap = Object.fromEntries(posts.map(p => [p.id, p.title]))
      enriched = enriched.map(s => ({
        ...s,
        post_title: s.post_id ? postMap[s.post_id] || null : null,
      }))
    }
  }

  // Summary counts
  const { data: allOpen } = await db
    .from('blog_suggestions')
    .select('severity')
    .eq('user_id', user.id)
    .eq('status', 'open')

  const summary = { total: 0, critical: 0, warning: 0, info: 0 }
  if (allOpen) {
    summary.total = allOpen.length
    for (const s of allOpen) {
      if (s.severity === 'critical') summary.critical++
      else if (s.severity === 'warning') summary.warning++
      else summary.info++
    }
  }

  return NextResponse.json({
    suggestions: enriched,
    total: count || 0,
    summary,
  })
}
