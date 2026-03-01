'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Lightbulb, AlertTriangle, AlertCircle, Info, Search, Link2,
  BookOpen, TrendingDown, RefreshCw, Check, X, Loader2, Filter,
} from 'lucide-react'

type Suggestion = {
  id: string
  post_id: string | null
  category: string
  severity: string
  title: string
  description: string
  action_label: string | null
  status: string
  created_at: string
  post_title?: string | null
}

type Summary = { total: number; critical: number; warning: number; info: number }

const CATEGORY_LABELS: Record<string, { label: string; Icon: typeof Search }> = {
  seo: { label: 'SEO', Icon: Search },
  content_freshness: { label: 'コンテンツ鮮度', Icon: RefreshCw },
  internal_links: { label: '内部リンク', Icon: Link2 },
  content_gap: { label: 'コンテンツギャップ', Icon: Lightbulb },
  readability: { label: '読みやすさ', Icon: BookOpen },
  performance: { label: 'パフォーマンス', Icon: TrendingDown },
}

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; Icon: typeof AlertCircle }> = {
  critical: { color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', Icon: AlertCircle },
  warning: { color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', Icon: AlertTriangle },
  info: { color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', Icon: Info },
}

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [summary, setSummary] = useState<Summary>({ total: 0, critical: 0, warning: 0, info: 0 })
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterSeverity, setFilterSeverity] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('open')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadSuggestions = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('status', filterStatus)
    if (filterCategory) params.set('category', filterCategory)
    if (filterSeverity) params.set('severity', filterSeverity)

    const res = await fetch(`/api/suggestions?${params}`)
    if (res.ok) {
      const data = await res.json()
      setSuggestions(data.suggestions || [])
      setSummary(data.summary || { total: 0, critical: 0, warning: 0, info: 0 })
    }
    setLoading(false)
  }, [filterCategory, filterSeverity, filterStatus])

  useEffect(() => { loadSuggestions() }, [loadSuggestions])

  const runAnalysis = async () => {
    setAnalyzing(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: ['seo', 'content_freshness', 'internal_links', 'readability'],
        }),
      })
      if (res.ok) {
        const data = await res.json()
        alert(`分析完了: ${data.posts_analyzed}記事を分析し、${data.suggestions_created}件の提案を生成しました`)
        loadSuggestions()
      } else {
        const err = await res.json()
        alert(err.error || '分析に失敗しました')
      }
    } catch {
      alert('分析に失敗しました')
    }
    setAnalyzing(false)
  }

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id)
    const res = await fetch(`/api/suggestions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setSuggestions(prev => prev.filter(s => s.id !== id))
      setSummary(prev => {
        const s = suggestions.find(x => x.id === id)
        if (!s) return prev
        return {
          ...prev,
          total: prev.total - 1,
          [s.severity]: (prev as any)[s.severity] - 1,
        }
      })
    }
    setUpdatingId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">改善提案</h1>
        <button
          onClick={runAnalysis}
          disabled={analyzing}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
          {analyzing ? '分析中...' : '分析を実行'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500">未対応の提案</p>
          <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{summary.total}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-400">重大</p>
          <p className="mt-1 text-3xl font-bold text-red-700 dark:text-red-300">{summary.critical}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-900/20">
          <p className="text-sm text-amber-600 dark:text-amber-400">警告</p>
          <p className="mt-1 text-3xl font-bold text-amber-700 dark:text-amber-300">{summary.warning}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-900/20">
          <p className="text-sm text-blue-600 dark:text-blue-400">情報</p>
          <p className="mt-1 text-3xl font-bold text-blue-700 dark:text-blue-300">{summary.info}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-gray-400" />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="open">未対応</option>
          <option value="accepted">対応済み</option>
          <option value="dismissed">無視</option>
          <option value="all">すべて</option>
        </select>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="">全カテゴリ</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select
          value={filterSeverity}
          onChange={e => setFilterSeverity(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="">全重要度</option>
          <option value="critical">重大</option>
          <option value="warning">警告</option>
          <option value="info">情報</option>
        </select>
      </div>

      {/* Suggestion List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900" />
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-900">
          <Lightbulb className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">
            {filterStatus === 'open' ? '未対応の提案はありません' : '該当する提案はありません'}
          </p>
          <p className="mt-1 text-xs text-gray-400">「分析を実行」で記事を分析し、改善提案を取得できます</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map(s => {
            const sev = SEVERITY_CONFIG[s.severity] || SEVERITY_CONFIG.info
            const cat = CATEGORY_LABELS[s.category]
            const SevIcon = sev.Icon
            const isExpanded = expandedId === s.id

            return (
              <div
                key={s.id}
                className={`rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 ${
                  s.status === 'open' ? '' : 'opacity-60'
                }`}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : s.id)}
                  className="flex w-full items-start gap-3 p-4 text-left"
                >
                  <div className={`mt-0.5 rounded-lg p-1.5 ${sev.bg}`}>
                    <SevIcon className={`h-4 w-4 ${sev.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 dark:text-white">{s.title}</span>
                      {cat && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          {cat.label}
                        </span>
                      )}
                    </div>
                    {s.post_title && (
                      <p className="mt-0.5 text-xs text-gray-400 truncate">
                        記事: {s.post_title}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">
                    {new Date(s.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3 dark:border-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {s.description}
                    </p>
                    {s.status === 'open' && (
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() => updateStatus(s.id, 'accepted')}
                          disabled={updatingId === s.id}
                          className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          <Check className="h-3 w-3" />
                          対応済み
                        </button>
                        <button
                          onClick={() => updateStatus(s.id, 'dismissed')}
                          disabled={updatingId === s.id}
                          className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800 disabled:opacity-50"
                        >
                          <X className="h-3 w-3" />
                          無視
                        </button>
                        {s.post_id && (
                          <Link
                            href={`/dashboard/posts/${s.post_id}/edit`}
                            className="ml-auto text-xs text-blue-600 hover:underline dark:text-blue-400"
                          >
                            記事を編集 →
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
