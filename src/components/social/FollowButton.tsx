'use client'

import { useState, useEffect } from 'react'
import { UserPlus, UserCheck } from 'lucide-react'

export default function FollowButton({ userId }: { userId: string }) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  useEffect(() => {
    fetch(`/api/follow?userId=${userId}`)
      .then(r => r.json())
      .then(d => {
        setIsFollowing(d.isFollowing)
        setFollowerCount(d.followerCount)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId])

  const toggle = async () => {
    setActing(true)
    try {
      const method = isFollowing ? 'DELETE' : 'POST'
      const res = await fetch('/api/follow', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (res.ok) {
        const newState = !isFollowing
        setIsFollowing(newState)
        setFollowerCount(c => c + (newState ? 1 : -1))
      } else if (res.status === 401) {
        window.location.href = '/login'
      }
    } catch {}
    setActing(false)
  }

  if (loading) {
    return (
      <button
        disabled
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 16px',
          borderRadius: '20px',
          border: '1px solid var(--c-border, #ddd)',
          background: 'transparent',
          color: 'var(--c-text-m, #666)',
          fontSize: '13px',
          cursor: 'default',
          opacity: 0.5,
        }}
      >
        <UserPlus size={14} />
        <span>...</span>
      </button>
    )
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <button
        onClick={toggle}
        disabled={acting}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 16px',
          borderRadius: '20px',
          border: isFollowing ? '1px solid var(--c-primary, #5c6b4a)' : '1px solid var(--c-border, #ddd)',
          background: isFollowing ? 'var(--c-primary, #5c6b4a)' : 'transparent',
          color: isFollowing ? '#fff' : 'var(--c-text, #333)',
          fontSize: '13px',
          fontWeight: 600,
          cursor: acting ? 'wait' : 'pointer',
          transition: 'all 0.2s',
          opacity: acting ? 0.7 : 1,
        }}
      >
        {isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
        <span>{isFollowing ? 'フォロー中' : 'フォロー'}</span>
      </button>
      {followerCount > 0 && (
        <span style={{ fontSize: '13px', color: 'var(--c-text-m, #666)' }}>
          {followerCount}人
        </span>
      )}
    </div>
  )
}
