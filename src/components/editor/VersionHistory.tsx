'use client'

import { useState, useEffect, useCallback } from 'react'
import { History, RotateCcw, X, FileText, Globe, Sparkles, Save } from 'lucide-react'
import type { PostVersion, VersionChangeType } from '@/lib/types'

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'たった今'
  if (minutes < 60) return `${minutes}分前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}時間前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}日前`
  const months = Math.floor(days / 30)
  return `${months}ヶ月前`
}

function changeTypeLabel(type: VersionChangeType): { icon: React.ReactNode; label: string; color: string } {
  switch (type) {
    case 'manual_save':
      return { icon: <Save className="h-3.5 w-3.5" />, label: '保存', color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30' }
    case 'auto_save':
      return { icon: <Save className="h-3.5 w-3.5" />, label: '自動保存', color: 'text-gray-500 bg-gray-50 dark:text-gray-400 dark:bg-gray-800' }
    case 'publish':
      return { icon: <Globe className="h-3.5 w-3.5" />, label: '公開', color: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30' }
    case 'unpublish':
      return { icon: <Globe className="h-3.5 w-3.5" />, label: '非公開', color: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30' }
    case 'ai_generate':
      return { icon: <Sparkles className="h-3.5 w-3.5" />, label: 'AI生成', color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/30' }
    case 'ai_rewrite':
      return { icon: <Sparkles className="h-3.5 w-3.5" />, label: 'AIリライト', color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/30' }
    case 'rollback':
      return { icon: <RotateCcw className="h-3.5 w-3.5" />, label: 'ロールバック', color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30' }
    default:
      return { icon: <FileText className="h-3.5 w-3.5" />, label: type, color: 'text-gray-500 bg-gray-50' }
  }
}

interface VersionHistoryProps {
  postId: string
  onRollback: (post: any) => void
}

export default function VersionHistory({ postId, onRollback }: VersionHistoryProps) {
  const [open, setOpen] = useState(false)
  const [versions, setVersions] = useState<PostVersion[]>([])
  const [loading, setLoading] = useState(false)
  const [rolling, setRolling] = useState<string | null>(null)

  const fetchVersions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/posts/${postId}/versions`)
      if (res.ok) {
        const data = await res.json()
        setVersions(data)
      }
    } catch (err) {
      console.error('Failed to fetch versions:', err)
    }
    setLoading(false)
  }, [postId])

  useEffect(() => {
    if (open) fetchVersions()
  }, [open, fetchVersions])

  const handleRollback = async (versionId: string, versionNumber: number) => {
    if (!confirm(`v${versionNumber}に戻しますか？現在の内容は新しいバージョンとして保存されます。`)) return

    setRolling(versionId)
    try {
      const res = await fetch(`/api/posts/${postId}/versions/${versionId}/rollback`, {
        method: 'POST',
      })
      if (res.ok) {
        const updatedPost = await res.json()
        onRollback(updatedPost)
        await fetchVersions()
      } else {
        alert('ロールバックに失敗しました')
      }
    } catch (err) {
      console.error('Rollback error:', err)
      alert('ロールバックに失敗しました')
    }
    setRolling(null)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        <History className="h-4 w-4" />
        バージョン履歴
        {versions.length > 0 && (
          <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            {versions.length}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md bg-white shadow-xl dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
                <History className="h-4 w-4" />
                バージョン履歴
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="h-[calc(100vh-57px)] overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div>
              ) : versions.length === 0 ? (
                <p className="py-12 text-center text-sm text-gray-400">バージョン履歴がありません</p>
              ) : (
                <div className="space-y-1">
                  {versions.map((v, i) => {
                    const ct = changeTypeLabel(v.change_type)
                    const isLatest = i === 0
                    return (
                      <div
                        key={v.id}
                        className="group relative rounded-lg border border-gray-100 p-3 hover:border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:border-gray-700 dark:hover:bg-gray-800/50"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                v{v.version_number}
                              </span>
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${ct.color}`}>
                                {ct.icon}
                                {ct.label}
                              </span>
                              {isLatest && (
                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                  最新
                                </span>
                              )}
                            </div>
                            <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                              {v.title}
                            </p>
                            {v.change_summary && (
                              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                                {v.change_summary}
                              </p>
                            )}
                            <div className="mt-1 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                              <span>{timeAgo(v.created_at)}</span>
                              {v.word_count > 0 && <span>{v.word_count}文字</span>}
                            </div>
                          </div>
                          {!isLatest && (
                            <button
                              onClick={() => handleRollback(v.id, v.version_number)}
                              disabled={rolling === v.id}
                              className="shrink-0 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 opacity-0 transition-opacity hover:bg-gray-100 group-hover:opacity-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                            >
                              {rolling === v.id ? (
                                <span className="flex items-center gap-1">
                                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <RotateCcw className="h-3 w-3" />
                                  戻す
                                </span>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
