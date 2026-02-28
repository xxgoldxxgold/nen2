'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './AuthCheck'

interface Props {
  userId: string
  initialFollowerCount: number
  initialFollowingCount: number
  showCounts?: boolean
}

export default function FollowButton({ userId, initialFollowerCount, initialFollowingCount, showCounts = true }: Props) {
  const { user, loading: authLoading } = useAuth()
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(initialFollowerCount)
  const [followingCount] = useState(initialFollowingCount)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    fetch(`/api/follow?user_id=${userId}`)
      .then(r => r.json())
      .then(d => {
        setIsFollowing(d.is_following)
        setFollowerCount(d.follower_count)
      })
      .catch(() => {})
  }, [user, userId])

  const handleToggle = async () => {
    if (!user) {
      window.location.href = '/login'
      return
    }
    setLoading(true)
    try {
      if (isFollowing) {
        await fetch('/api/follow', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ following_id: userId }),
        })
        setIsFollowing(false)
        setFollowerCount(c => c - 1)
      } else {
        await fetch('/api/follow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ following_id: userId }),
        })
        setIsFollowing(true)
        setFollowerCount(c => c + 1)
      }
    } catch {}
    setLoading(false)
  }

  const isOwnProfile = !authLoading && user?.id === userId

  return (
    <div className="follow-section">
      {showCounts && (
        <div className="follow-counts">
          <span><strong>{followerCount}</strong> フォロワー</span>
          <span><strong>{followingCount}</strong> フォロー中</span>
        </div>
      )}
      {!isOwnProfile && (
        <button
          onClick={handleToggle}
          disabled={loading || authLoading}
          className={`follow-btn ${isFollowing ? 'follow-btn--following' : ''}`}
        >
          {loading ? '...' : isFollowing ? 'フォロー中' : 'フォローする'}
        </button>
      )}
    </div>
  )
}
