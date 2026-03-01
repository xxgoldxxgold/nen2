'use client'

import { useEffect, useRef } from 'react'

export default function InsightsTracker({ postId, authorId }: { postId: string; authorId: string }) {
  const startTime = useRef(Date.now())
  const maxScrollDepth = useRef(0)
  const sentBeacon = useRef(false)

  useEffect(() => {
    const sessionId = getOrCreateSessionId()

    // Track initial pageview
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId,
        authorId,
        sessionId,
        path: window.location.pathname,
        referrer: document.referrer || null,
        utm_source: new URLSearchParams(window.location.search).get('utm_source'),
        utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
      }),
    }).catch(() => {})

    // Scroll depth tracking with IntersectionObserver
    const markers = [25, 50, 75, 100]
    const articleEl = document.querySelector('article')
    if (articleEl) {
      const sentinels: HTMLDivElement[] = []
      for (const pct of markers) {
        const sentinel = document.createElement('div')
        sentinel.style.position = 'absolute'
        sentinel.style.top = `${pct}%`
        sentinel.style.height = '1px'
        sentinel.style.width = '1px'
        sentinel.style.pointerEvents = 'none'
        sentinel.dataset.depth = String(pct)
        articleEl.style.position = 'relative'
        articleEl.appendChild(sentinel)
        sentinels.push(sentinel)
      }

      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const depth = parseInt((entry.target as HTMLElement).dataset.depth || '0')
            if (depth > maxScrollDepth.current) {
              maxScrollDepth.current = depth
            }
          }
        }
      }, { threshold: 0 })

      for (const s of sentinels) observer.observe(s)

      return () => {
        observer.disconnect()
        for (const s of sentinels) s.remove()
      }
    }
  }, [postId, authorId])

  // Send exit event with duration and scroll depth
  useEffect(() => {
    const sendExitEvent = () => {
      if (sentBeacon.current) return
      sentBeacon.current = true

      const duration = Math.round((Date.now() - startTime.current) / 1000)
      const data = JSON.stringify({
        postId,
        authorId,
        sessionId: getOrCreateSessionId(),
        event_type: 'exit',
        duration_seconds: duration,
        scroll_depth: maxScrollDepth.current,
      })

      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/events', data)
      } else {
        fetch('/api/analytics/events', { method: 'POST', body: data, keepalive: true }).catch(() => {})
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') sendExitEvent()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', sendExitEvent)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', sendExitEvent)
    }
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
