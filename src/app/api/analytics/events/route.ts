import { createDataServer } from '@/lib/supabase/data-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const db = createDataServer()

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { events } = body
  if (!Array.isArray(events) || events.length === 0) {
    return NextResponse.json({ error: 'events array required' }, { status: 400 })
  }

  // Limit batch size
  const batch = events.slice(0, 20)

  const rows = batch
    .filter((e: any) => e.user_id && e.event_type && e.session_id)
    .map((e: any) => ({
      user_id: e.user_id,
      post_id: e.post_id || null,
      event_type: e.event_type,
      session_id: String(e.session_id).slice(0, 64),
      referrer: e.referrer ? String(e.referrer).slice(0, 500) : null,
      device_type: ['mobile', 'tablet', 'desktop'].includes(e.device_type) ? e.device_type : null,
      duration_seconds: typeof e.duration_seconds === 'number' ? Math.min(e.duration_seconds, 7200) : null,
      page_path: e.page_path ? String(e.page_path).slice(0, 500) : null,
    }))

  if (rows.length === 0) {
    return NextResponse.json({ error: 'No valid events' }, { status: 400 })
  }

  const { error } = await db.from('blog_analytics_events').insert(rows)

  if (error) {
    console.error('Analytics insert error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, count: rows.length })
}
