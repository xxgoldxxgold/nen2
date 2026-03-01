'use client'

import { useState } from 'react'
import { Search, Sparkles, TrendingUp, AlertCircle } from 'lucide-react'

interface SeoSectionProps {
  title: string
  content: string
  metaDescription: string
  slug?: string
  seoScore: number
  onScoreChange: (score: number) => void
}

export default function SeoSection({ title, content, metaDescription, slug, seoScore, onScoreChange }: SeoSectionProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!title && !content) {
      setError('タイトルまたは本文を入力してから分析してください')
      return
    }
    setAnalyzing(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/seo-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, metaDescription }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'SEO分析に失敗しました')
        return
      }
      const data = await res.json()
      const sug: string[] = data.suggestions ?? []
      // パース失敗メッセージをerrorに振り分ける
      if (sug.length === 1 && sug[0].includes('失敗')) {
        setError(sug[0])
        return
      }
      onScoreChange(data.score ?? 0)
      setSuggestions(sug)
    } catch {
      setError('SEO分析に失敗しました')
    } finally {
      setAnalyzing(false)
    }
  }

  const scoreColor = seoScore >= 80 ? 'text-green-600 dark:text-green-400' :
    seoScore >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'

  const scoreBg = seoScore >= 80 ? 'bg-green-50 dark:bg-green-900/20' :
    seoScore >= 50 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-red-50 dark:bg-red-900/20'

  // Google search preview
  const previewTitle = title || '記事タイトル'
  const previewDesc = metaDescription || content?.replace(/[#*`>\-\[\]()!]/g, '').slice(0, 160) || '記事の説明文がここに表示されます...'
  const previewUrl = `nen2.com/${slug || 'your-article'}`

  return (
    <div className="space-y-4">
      {/* Score & Analyze button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">SEO分析</h3>
          {seoScore > 0 && (
            <span className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${scoreBg} ${scoreColor}`}>
              {seoScore}点
            </span>
          )}
        </div>
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50 dark:bg-purple-900/20 dark:text-purple-400"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {analyzing ? '分析中...' : 'AIで分析'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Google search preview */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
        <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">Google検索プレビュー</p>
        <div className="space-y-0.5">
          <p className="text-xs text-green-700 dark:text-green-500 truncate">{previewUrl}</p>
          <p className="text-sm font-medium text-blue-700 dark:text-blue-400 line-clamp-1">{previewTitle}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{previewDesc}</p>
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">改善提案</p>
          <ul className="space-y-1.5">
            {suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                <Search className="mt-0.5 h-3 w-3 shrink-0 text-blue-500" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
