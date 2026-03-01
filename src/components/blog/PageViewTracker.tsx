'use client'

import { useEffect } from 'react'

export default function PageViewTracker({ postId, authorId }: { postId: string; authorId: string }) {
  useEffect(() => {
    const sessionId = getOrCreateSessionId()
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId,
        authorId,
        sessionId,
        path: window.location.pathname,
        referrer: document.referrer || null,
      }),
    }).catch(() => {})
  }, [postId, authorId])

  return null
}

function getOrCreateSessionId(): string {
  const key = 'nen2_sid'
  let sid = sessionStorage.getItem(key)
  if (!sid) {
    sid = crypto.randomUUID()
    sessionStorage.setItem(key, sid)
  }
  return sid
}
