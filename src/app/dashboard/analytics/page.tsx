'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createDataClient } from '@/lib/supabase/data-client'
import { BarChart3, Eye, Users, Clock, BookOpen, TrendingUp, TrendingDown, Minus, Monitor, Smartphone, Tablet } from 'lucide-react'

const aiLabels: Record<string, string> = {
  generate: '記事生成',
  rewrite: 'リライト',
  suggest: '続き提案',
  seo_analyze: 'SEO分析',
  generate_image: '画像生成',
  suggest_tags: 'タグ提案',
  design: 'デザイン変更',
  field_assist: 'フィールドAI',
}

type InsightsData = {
  summary: {
    total_pageviews: number
    total_unique_visitors: number
    avg_duration_seconds: number
    read_rate: number
    pageviews_trend: number
  }
  daily_data: { date: string; pageviews: number; unique_visitors: number }[]
  top_posts: { post_id: string; title: string; pageviews: number }[]
  top_referrers: { source: string; count: number }[]
  device_breakdown: { mobile: number; desktop: number; tablet: number }
}

type AIData = {
  totalPosts: number
  publishedPosts: number
  aiTotal: number
  aiUsageByType: Record<string, number>
}

export default function AnalyticsPage() {
  const [insights, setInsights] = useState<InsightsData | null>(null)
  const [aiData, setAIData] = useState<AIData | null>(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const auth = createClient()
      const db = createDataClient()
      const { data: { session } } = await auth.auth.getSession()
      if (!session?.user) return

      const uid = session.user.id

      const [insightsRes, statuses, logs] = await Promise.all([
        fetch(`/api/analytics/overview?days=${days}`),
        db.from('blog_posts').select('status').eq('user_id', uid),
        db.from('ai_usage_logs').select('type').eq('user_id', uid).order('created_at', { ascending: false }).limit(50),
      ])

      if (insightsRes.ok) {
        setInsights(await insightsRes.json())
      }

      const posts = statuses.data || []
      const byType = (logs.data || []).reduce<Record<string, number>>((acc, log) => {
        acc[log.type] = (acc[log.type] || 0) + 1
        return acc
      }, {})
      setAIData({
        totalPosts: posts.length,
        publishedPosts: posts.filter(p => p.status === 'published').length,
        aiTotal: logs.data?.length || 0,
        aiUsageByType: byType,
      })
      setLoading(false)
    }
    load()
  }, [days])

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900" />
          ))}
        </div>
        <div className="h-64 rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900" />
      </div>
    )
  }

  const s = insights?.summary
  const maxAI = aiData ? Math.max(...Object.values(aiData.aiUsageByType), 1) : 1

  const TrendIcon = ({ value }: { value: number }) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  const formatDuration = (sec: number) => {
    if (sec < 60) return `${sec}秒`
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return s > 0 ? `${m}分${s}秒` : `${m}分`
  }

  // Simple bar chart via CSS
  const maxDaily = insights?.daily_data?.length
    ? Math.max(...insights.daily_data.map(d => d.pageviews), 1)
    : 1

  const deviceTotal = insights
    ? (insights.device_breakdown.desktop + insights.device_breakdown.mobile + insights.device_breakdown.tablet) || 1
    : 1

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">アクセス解析</h1>
        <select
          value={days}
          onChange={e => setDays(Number(e.target.value))}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value={7}>過去7日</option>
          <option value={30}>過去30日</option>
          <option value={90}>過去90日</option>
        </select>
      </div>

      {/* Summary Cards */}
      {s && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Eye className="h-4 w-4" />
              <span>ページビュー</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {s.total_pageviews.toLocaleString()}
            </p>
            <div className="mt-1 flex items-center gap-1 text-sm">
              <TrendIcon value={s.pageviews_trend} />
              <span className={s.pageviews_trend > 0 ? 'text-green-600' : s.pageviews_trend < 0 ? 'text-red-600' : 'text-gray-400'}>
                {s.pageviews_trend > 0 ? '+' : ''}{s.pageviews_trend}%
              </span>
              <span className="text-gray-400">前期比</span>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users className="h-4 w-4" />
              <span>ユニーク訪問者</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {s.total_unique_visitors.toLocaleString()}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>平均滞在時間</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {formatDuration(s.avg_duration_seconds)}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <BookOpen className="h-4 w-4" />
              <span>読了率</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {Math.round(s.read_rate * 100)}%
            </p>
          </div>
        </div>
      )}

      {/* Daily Chart */}
      {insights?.daily_data && insights.daily_data.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">日別アクセス</h2>
          <div className="flex items-end gap-[2px]" style={{ height: 160 }}>
            {insights.daily_data.map(d => (
              <div key={d.date} className="group relative flex-1 min-w-0">
                <div
                  className="w-full rounded-t bg-blue-500 transition-colors group-hover:bg-blue-600"
                  style={{ height: `${Math.max((d.pageviews / maxDaily) * 140, 2)}px` }}
                />
                <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block dark:bg-gray-200 dark:text-gray-900">
                  {d.date.slice(5)}: {d.pageviews}PV / {d.unique_visitors}UU
                </div>
              </div>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-xs text-gray-400">
            <span>{insights.daily_data[0]?.date.slice(5)}</span>
            <span>{insights.daily_data[insights.daily_data.length - 1]?.date.slice(5)}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Posts */}
        {insights?.top_posts && insights.top_posts.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">人気記事</h2>
            <div className="space-y-3">
              {insights.top_posts.map((post, i) => (
                <div key={post.post_id} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate text-sm text-gray-700 dark:text-gray-300">{post.title}</span>
                  <span className="shrink-0 text-sm font-medium text-gray-900 dark:text-white">{post.pageviews}PV</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Referrers */}
        {insights?.top_referrers && insights.top_referrers.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">流入元</h2>
            <div className="space-y-3">
              {insights.top_referrers.map(ref => {
                const maxRef = insights.top_referrers[0]?.count || 1
                return (
                  <div key={ref.source} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 truncate text-sm text-gray-600 dark:text-gray-400">{ref.source}</span>
                    <div className="flex-1">
                      <div className="h-5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                          className="h-full rounded-full bg-green-500"
                          style={{ width: `${(ref.count / maxRef) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-10 shrink-0 text-right text-sm font-medium text-gray-900 dark:text-white">{ref.count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Device Breakdown */}
      {insights && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">デバイス</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            {([
              { key: 'desktop', label: 'デスクトップ', Icon: Monitor },
              { key: 'mobile', label: 'モバイル', Icon: Smartphone },
              { key: 'tablet', label: 'タブレット', Icon: Tablet },
            ] as const).map(({ key, label, Icon }) => {
              const count = insights.device_breakdown[key]
              const pct = Math.round((count / deviceTotal) * 100)
              return (
                <div key={key}>
                  <Icon className="mx-auto h-6 w-6 text-gray-400" />
                  <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{pct}%</p>
                  <p className="text-xs text-gray-500">{label} ({count})</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* No analytics data message */}
      {insights && s && s.total_pageviews === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
          <Eye className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">まだ訪問者データがありません</p>
          <p className="mt-1 text-xs text-gray-400">ブログが閲覧されるとここにデータが表示されます</p>
        </div>
      )}

      {/* AI Usage Section */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500">総記事数</p>
          <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{aiData?.totalPosts ?? 0}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500">公開済み</p>
          <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{aiData?.publishedPosts ?? 0}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500">AI利用回数（直近50件）</p>
          <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{aiData?.aiTotal ?? 0}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">AI機能利用状況</h2>
        {aiData && Object.keys(aiData.aiUsageByType).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(aiData.aiUsageByType).map(([type, count]) => (
              <div key={type} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-sm text-gray-600 dark:text-gray-400">{aiLabels[type] || type}</span>
                <div className="flex-1">
                  <div className="h-6 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${Math.min((count / maxAI) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <span className="w-8 text-right text-sm font-medium text-gray-900 dark:text-white">{count}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">まだAI機能の利用データがありません</p>
          </div>
        )}
      </div>
    </div>
  )
}
