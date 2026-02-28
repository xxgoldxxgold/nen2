'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './AuthCheck'
import type { CommentWithAuthor } from '@/lib/types'

interface Props {
  articleId: string
  initialComments: CommentWithAuthor[]
}

export default function CommentSection({ articleId, initialComments }: Props) {
  const { user } = useAuth()
  const [comments, setComments] = useState<CommentWithAuthor[]>(initialComments)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Refresh comments on mount for latest data
  useEffect(() => {
    fetch(`/api/comments?article_id=${articleId}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setComments(d) })
      .catch(() => {})
  }, [articleId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      window.location.href = '/login'
      return
    }
    const trimmed = body.trim()
    if (!trimmed) return
    if (trimmed.length > 1000) {
      setError('1000文字以内で入力してください')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId, body: trimmed }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'エラーが発生しました')
        return
      }
      const newComment = await res.json()
      setComments(prev => [...prev, newComment])
      setBody('')
    } catch {
      setError('送信に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm('このコメントを削除しますか？')) return
    try {
      await fetch(`/api/comments?comment_id=${commentId}`, { method: 'DELETE' })
      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch {}
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <div className="comment-section">
      <h3 className="comment-section__title">コメント ({comments.length})</h3>

      {comments.length > 0 && (
        <div className="comment-list">
          {comments.map(c => (
            <div key={c.id} className="comment">
              <div className="comment__header">
                {c.author_avatar_url ? (
                  <img src={c.author_avatar_url} alt="" className="comment__avatar" />
                ) : (
                  <span className="comment__avatar comment__avatar--placeholder">
                    {c.author_name.charAt(0)}
                  </span>
                )}
                <span className="comment__author">{c.author_name}</span>
                <span className="comment__date">{formatDate(c.created_at)}</span>
                {user?.id === c.user_id && (
                  <button onClick={() => handleDelete(c.id)} className="comment__delete">削除</button>
                )}
              </div>
              <p className="comment__body">{c.body}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="comment-form">
        {user ? (
          <>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="コメントを書く..."
              maxLength={1000}
              rows={3}
              className="comment-form__input"
            />
            <div className="comment-form__footer">
              <span className="comment-form__count">{body.length}/1000</span>
              {error && <span className="comment-form__error">{error}</span>}
              <button type="submit" disabled={submitting || !body.trim()} className="comment-form__submit">
                {submitting ? '送信中...' : '投稿する'}
              </button>
            </div>
          </>
        ) : (
          <p className="comment-form__login">
            コメントするには<a href="/login">ログイン</a>してください
          </p>
        )}
      </form>
    </div>
  )
}
