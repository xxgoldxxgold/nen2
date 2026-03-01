'use client'

import { useState, useEffect } from 'react'
import { Lightbulb, Play, Check, X, AlertTriangle, AlertCircle, Info } from 'lucide-react'

interface Suggestion {
  id: string
  post_id: string | null
  category: string
  severity: string
  title: string
  description: string
  action_label: string | null
  status: string
  created_at: string
}

const categoryLabels: Record<string, string> = {
  seo: 'SEO',
  content_freshness: 'コンテンツ鮮度',
  internal_links: '内部リンク',
  content_gap: 'コンテンツギャップ',
  readability: '読みやすさ',
  performance: 'パフォーマンス',
}

const severityConfig: Record<string, { icon: typeof AlertCircle; color: string; bg: string }> = {
  critical: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' },
  info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' },
}

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  const loadSuggestions = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/suggestions')
      if (res.ok) setSuggestions(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadSuggestions() }, [])

  const handleAnalyze = async () => {
    setAnalyzing(true)
    try {
      const res = await fetch('/api/ai/analyze', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        alert(`分析完了: ${data.suggestions_count}件の提案が見つかりました`)
        loadSuggestions()
      } else {
        const err = await res.json()
        alert(err.error || '分析に失敗しました')
      }
    } finally {
      setAnalyzing(false)
    }
  }

  const handleAction = async (id: string, status: string) => {
    await fetch('/api/suggestions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setSuggestions(prev => prev.filter(s => s.id !== id))
  }

  const filtered = filter === 'all'
    ? suggestions
    : suggestions.filter(s => s.severity === filter)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
          <Lightbulb className="h-6 w-6" />
          改善提案
        </h1>
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Play className={`h-4 w-4 ${analyzing ? 'animate-pulse' : ''}`} />
          {analyzing ? '分析中...' : '分析を実行'}
        </button>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        公開済み記事をAIが分析し、SEO・コンテンツ・読みやすさの改善点を提案します。
      </p>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'critical', 'warning', 'info'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            {f === 'all' ? 'すべて' : f === 'critical' ? '重要' : f === 'warning' ? '警告' : '情報'}
            {f !== 'all' && ` (${suggestions.filter(s => s.severity === f).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-sm text-gray-400">
          <Lightbulb className="mx-auto mb-2 h-10 w-10" />
          {suggestions.length === 0 ? '提案がありません。「分析を実行」してください。' : 'このフィルターに該当する提案はありません。'}
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(s => {
          const config = severityConfig[s.severity] || severityConfig.info
          const Icon = config.icon
          return (
            <div key={s.id} className={`rounded-lg border p-4 ${config.bg}`}>
              <div className="flex items-start gap-3">
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${config.color}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-white/60 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800/60">
                      {categoryLabels[s.category] || s.category}
                    </span>
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{s.title}</h3>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{s.description}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => handleAction(s.id, 'completed')}
                    className="rounded-lg bg-green-100 p-1.5 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                    title="対応済み"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleAction(s.id, 'dismissed')}
                    className="rounded-lg bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                    title="無視"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
