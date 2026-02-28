'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './AuthCheck'

interface Props {
  articleId: string
  initialLikeCount: number
}

export default function LikeButton({ articleId, initialLikeCount }: Props) {
  const { user } = useAuth()
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    fetch(`/api/like?article_id=${articleId}`)
      .then(r => r.json())
      .then(d => {
        setIsLiked(d.is_liked)
        setLikeCount(d.like_count)
      })
      .catch(() => {})
  }, [user, articleId])

  const handleToggle = async () => {
    if (!user) {
      window.location.href = '/login'
      return
    }
    setLoading(true)
    try {
      if (isLiked) {
        await fetch('/api/like', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ article_id: articleId }),
        })
        setIsLiked(false)
        setLikeCount(c => c - 1)
      } else {
        await fetch('/api/like', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ article_id: articleId }),
        })
        setIsLiked(true)
        setLikeCount(c => c + 1)
      }
    } catch {}
    setLoading(false)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`like-btn ${isLiked ? 'like-btn--liked' : ''}`}
      aria-label={isLiked ? 'いいね済み' : 'いいね'}
    >
      <span className="like-btn__icon">{isLiked ? '♥' : '♡'}</span>
      <span className="like-btn__count">{likeCount}</span>
    </button>
  )
}
