import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const db = createDataServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const url = new URL(request.url)
  const days = parseInt(url.searchParams.get('days') || '30')
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceISO = since.toISOString()

  // Previous period for comparison
  const prevSince = new Date()
  prevSince.setDate(prevSince.getDate() - days * 2)
  const prevUntil = sinceISO

  // Current period stats
  const { data: currentEvents } = await db
    .from('blog_analytics_events')
    .select('event_type, session_id, post_id, referrer, device_type, duration_seconds, created_at')
    .eq('user_id', user.id)
    .gte('created_at', sinceISO)

  // Previous period stats (for trend)
  const { count: prevPageviews } = await db
    .from('blog_analytics_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('event_type', 'pageview')
    .gte('created_at', prevSince.toISOString())
    .lt('created_at', prevUntil)

  const events = currentEvents || []
  const pageviews = events.filter(e => e.event_type === 'pageview')
  const exits = events.filter(e => e.event_type === 'exit')
  const readCompletes = events.filter(e => e.event_type === 'read_complete')
  const uniqueSessions = new Set(pageviews.map(e => e.session_id)).size

  // Average duration
  const durations = exits.filter(e => e.duration_seconds && e.duration_seconds > 0)
  const avgDuration = durations.length > 0
    ? Math.round(durations.reduce((s, e) => s + e.duration_seconds!, 0) / durations.length)
    : 0

  // Read rate
  const readRate = pageviews.length > 0 ? readCompletes.length / pageviews.length : 0

  // PV trend
  const pvTrend = (prevPageviews && prevPageviews > 0)
    ? Math.round((pageviews.length - prevPageviews) / prevPageviews * 100 * 10) / 10
    : 0

  // Daily data
  const dailyMap: Record<string, { pageviews: number; visitors: Set<string> }> = {}
  for (const e of pageviews) {
    const d = e.created_at.slice(0, 10)
    if (!dailyMap[d]) dailyMap[d] = { pageviews: 0, visitors: new Set() }
    dailyMap[d].pageviews++
    dailyMap[d].visitors.add(e.session_id)
  }
  const dailyData = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, pageviews: v.pageviews, unique_visitors: v.visitors.size }))

  // Top posts
  const postPVs: Record<string, number> = {}
  for (const e of pageviews) {
    if (e.post_id) postPVs[e.post_id] = (postPVs[e.post_id] || 0) + 1
  }
  const topPostIds = Object.entries(postPVs).sort((a, b) => b[1] - a[1]).slice(0, 10)

  let topPosts: { post_id: string; title: string; pageviews: number }[] = []
  if (topPostIds.length > 0) {
    const { data: posts } = await db
      .from('blog_posts')
      .select('id, title')
      .in('id', topPostIds.map(([id]) => id))

    if (posts) {
      const postMap = Object.fromEntries(posts.map(p => [p.id, p.title]))
      topPosts = topPostIds.map(([id, pv]) => ({
        post_id: id,
        title: postMap[id] || '不明',
        pageviews: pv,
      }))
    }
  }

  // Top referrers
  const refCounts: Record<string, number> = {}
  for (const e of pageviews) {
    if (e.referrer) {
      try {
        const host = new URL(e.referrer).hostname.replace('www.', '')
        refCounts[host] = (refCounts[host] || 0) + 1
      } catch { /* ignore */ }
    }
  }
  const topReferrers = Object.entries(refCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([source, count]) => ({ source, count }))

  // Device breakdown
  const deviceCounts: Record<string, number> = { mobile: 0, desktop: 0, tablet: 0 }
  for (const e of pageviews) {
    if (e.device_type && e.device_type in deviceCounts) deviceCounts[e.device_type]++
  }

  return NextResponse.json({
    summary: {
      total_pageviews: pageviews.length,
      total_unique_visitors: uniqueSessions,
      avg_duration_seconds: avgDuration,
      read_rate: Math.round(readRate * 100) / 100,
      pageviews_trend: pvTrend,
    },
    daily_data: dailyData,
    top_posts: topPosts,
    top_referrers: topReferrers,
    device_breakdown: deviceCounts,
  })
}
