'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'

export default function LikeButton({ postId }: { postId: string }) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  useEffect(() => {
    fetch(`/api/like?postId=${postId}`)
      .then(r => r.json())
      .then(d => {
        setIsLiked(d.isLiked)
        setLikeCount(d.likeCount)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [postId])

  const toggle = async () => {
    setActing(true)
    try {
      const method = isLiked ? 'DELETE' : 'POST'
      const res = await fetch('/api/like', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      })
      if (res.ok) {
        const newState = !isLiked
        setIsLiked(newState)
        setLikeCount(c => c + (newState ? 1 : -1))
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
          padding: '8px 20px',
          borderRadius: '24px',
          border: '1px solid var(--c-border, #ddd)',
          background: 'transparent',
          fontSize: '14px',
          cursor: 'default',
          opacity: 0.5,
        }}
      >
        <Heart size={18} />
        <span>...</span>
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      disabled={acting}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 20px',
        borderRadius: '24px',
        border: isLiked ? '1px solid #e11d48' : '1px solid var(--c-border, #ddd)',
        background: isLiked ? '#fff1f2' : 'transparent',
        color: isLiked ? '#e11d48' : 'var(--c-text-m, #666)',
        fontSize: '14px',
        fontWeight: 600,
        cursor: acting ? 'wait' : 'pointer',
        transition: 'all 0.2s',
        opacity: acting ? 0.7 : 1,
      }}
    >
      <Heart
        size={18}
        fill={isLiked ? '#e11d48' : 'none'}
        stroke={isLiked ? '#e11d48' : 'currentColor'}
      />
      <span>{likeCount > 0 ? likeCount : ''} いいね</span>
    </button>
  )
}
