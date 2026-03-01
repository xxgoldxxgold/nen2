'use client'

import { useState, useEffect } from 'react'
import { History, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import VersionDiff from './VersionDiff'

interface Version {
  id: string
  version_number: number
  title: string
  content?: string
  change_type: string
  change_summary: string | null
  word_count: number | null
  created_at: string
}

const changeTypeLabels: Record<string, string> = {
  manual_save: '手動保存',
  auto_save: '自動保存',
  publish: '公開',
  unpublish: '非公開',
  ai_generate: 'AI生成',
  ai_rewrite: 'AIリライト',
  rollback: 'ロールバック',
}

export default function VersionHistory({
  postId,
  currentContent,
  onRollback,
}: {
  postId: string
  currentContent: string
  onRollback: (title: string, content: string, metaDescription: string | null) => void
}) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [diffContent, setDiffContent] = useState<string | null>(null)
  const [rolling, setRolling] = useState(false)

  const loadVersions = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/posts/${postId}/versions`)
      if (res.ok) setVersions(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadVersions() }, [postId])

  const handleExpand = async (v: Version) => {
    if (expandedId === v.id) {
      setExpandedId(null)
      setDiffContent(null)
      return
    }
    setExpandedId(v.id)
    const res = await fetch(`/api/posts/${postId}/versions/${v.id}`)
    if (res.ok) {
      const detail = await res.json()
      setDiffContent(detail.content)
    }
  }

  const handleRollback = async (v: Version) => {
    if (!confirm(`v${v.version_number}に戻しますか？現在の内容はバージョン履歴に保存されます。`)) return
    setRolling(true)
    try {
      const res = await fetch(`/api/posts/${postId}/versions/${v.id}/rollback`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        onRollback(data.title, data.content || '', data.meta_description || '')
        loadVersions()
      }
    } finally {
      setRolling(false)
    }
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'たった今'
    if (diffMin < 60) return `${diffMin}分前`
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour}時間前`
    const diffDay = Math.floor(diffHour / 24)
    if (diffDay < 30) return `${diffDay}日前`
    return d.toLocaleDateString('ja-JP')
  }

  if (loading) {
    return <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>
  }

  if (versions.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-400">
        <History className="mx-auto mb-2 h-8 w-8" />
        バージョン履歴がありません
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {versions.map((v) => (
        <div key={v.id} className="rounded-lg border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => handleExpand(v)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
              {v.version_number}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  {changeTypeLabels[v.change_type] || v.change_type}
                </span>
                <span className="text-xs text-gray-400">{formatTime(v.created_at)}</span>
                {v.word_count != null && (
                  <span className="text-xs text-gray-400">{v.word_count.toLocaleString()}文字</span>
                )}
              </div>
              {v.change_summary && (
                <p className="mt-0.5 truncate text-xs text-gray-500">{v.change_summary}</p>
              )}
            </div>
            {expandedId === v.id ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
          </button>

          {expandedId === v.id && diffContent !== null && (
            <div className="border-t border-gray-200 p-4 dark:border-gray-700">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs text-gray-500">現在の内容との差分</span>
                <button
                  onClick={() => handleRollback(v)}
                  disabled={rolling}
                  className="flex items-center gap-1 rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-100 disabled:opacity-50 dark:bg-orange-900/20 dark:text-orange-400"
                >
                  <RotateCcw className="h-3 w-3" />
                  このバージョンに戻す
                </button>
              </div>
              <VersionDiff oldText={diffContent} newText={currentContent} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
