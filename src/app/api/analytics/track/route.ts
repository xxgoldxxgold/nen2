import { createDataServer } from '@/lib/supabase/data-server'
import { parseUserAgent } from '@/lib/analytics'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { postId, authorId, sessionId, path, referrer } = await request.json()
    if (!postId || !authorId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const db = createDataServer()
    const ua = request.headers.get('user-agent') || ''
    const { device_type, browser } = parseUserAgent(ua)

    // 30-minute debounce per session+post
    if (sessionId) {
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
      const { data: existing } = await db
        .from('nen2_page_views')
        .select('id')
        .eq('post_id', postId)
        .eq('session_id', sessionId)
        .gte('created_at', thirtyMinAgo)
        .limit(1)
      if (existing && existing.length > 0) {
        return NextResponse.json({ ok: true, deduplicated: true })
      }
    }

    await db.from('nen2_page_views').insert({
      post_id: postId,
      user_id: authorId,
      session_id: sessionId || null,
      path: path || null,
      referrer: referrer || null,
      user_agent: ua || null,
      device_type,
      browser,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Analytics track error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
