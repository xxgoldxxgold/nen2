import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const db = createDataServer()
  const days = parseInt(request.nextUrl.searchParams.get('days') || '30')
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  // All page views for this user's posts
  const { data: views } = await db
    .from('nen2_page_views')
    .select('id, post_id, session_id, path, referrer, device_type, browser, country, created_at')
    .eq('user_id', user.id)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(10000)

  // Total all-time
  const { count: totalAllTime } = await db
    .from('nen2_page_views')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // User's articles for title lookup
  const { data: articles } = await db
    .from('articles')
    .select('id, title, slug')
    .eq('user_id', user.id)

  const articleMap: Record<string, { title: string; slug: string }> = {}
  for (const a of articles || []) {
    articleMap[a.id] = { title: a.title, slug: a.slug }
  }

  return NextResponse.json({
    views: views || [],
    totalAllTime: totalAllTime || 0,
    articles: articleMap,
  }, {
    headers: { 'Cache-Control': 'private, max-age=60' },
  })
}
