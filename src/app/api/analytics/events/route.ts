import { createDataServer } from '@/lib/supabase/data-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { postId, authorId, sessionId, event_type, duration_seconds, scroll_depth } = body

    if (!postId || !authorId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const db = createDataServer()

    if (event_type === 'exit') {
      // Update the most recent pageview for this session with duration and scroll depth
      const { data: recentView } = await db
        .from('nen2_page_views')
        .select('id')
        .eq('post_id', postId)
        .eq('session_id', sessionId)
        .eq('event_type', 'pageview')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (recentView) {
        await db
          .from('nen2_page_views')
          .update({
            duration_seconds: duration_seconds || null,
            scroll_depth: scroll_depth || null,
          })
          .eq('id', recentView.id)
      }
    } else {
      // Insert a new event row
      await db.from('nen2_page_views').insert({
        post_id: postId,
        user_id: authorId,
        session_id: sessionId,
        event_type: event_type || 'event',
        duration_seconds: duration_seconds || null,
        scroll_depth: scroll_depth || null,
        path: null,
        referrer: null,
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // Don't fail beacon requests
  }
}
