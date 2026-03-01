'use client'

import { useState, useEffect, useMemo } from 'react'
import { BarChart3, Eye, Users, Globe, Monitor, Smartphone, Tablet } from 'lucide-react'

interface ViewRow {
  id: string
  post_id: string
  session_id: string | null
  referrer: string | null
  device_type: string | null
  browser: string | null
  country: string | null
  created_at: string
}

export default function AnalyticsPage() {
  const [views, setViews] = useState<ViewRow[]>([])
  const [totalAllTime, setTotalAllTime] = useState(0)
  const [articles, setArticles] = useState<Record<string, { title: string; slug: string }>>({})
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/analytics?days=${days}`)
      .then(r => r.json())
      .then(data => {
        setViews(data.views || [])
        setTotalAllTime(data.totalAllTime || 0)
        setArticles(data.articles || {})
      })
      .finally(() => setLoading(false))
  }, [days])

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const todayPV = views.filter(v => v.created_at.slice(0, 10) === today).length
    const uniqueSessions = new Set(views.map(v => v.session_id).filter(Boolean)).size

    // Daily PV for chart
    const dailyMap: Record<string, number> = {}
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
      dailyMap[d] = 0
    }
    for (const v of views) {
      const d = v.created_at.slice(0, 10)
      if (d in dailyMap) dailyMap[d]++
    }
    const dailyData = Object.entries(dailyMap).map(([date, count]) => ({ date, count }))
    const maxDaily = Math.max(1, ...dailyData.map(d => d.count))

    // Post ranking
    const postCounts: Record<string, number> = {}
    for (const v of views) {
      postCounts[v.post_id] = (postCounts[v.post_id] || 0) + 1
    }
    const postRanking = Object.entries(postCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)

    // Referrer
    const refCounts: Record<string, number> = {}
    for (const v of views) {
      let ref = 'ダイレクト'
      if (v.referrer) {
        try { ref = new URL(v.referrer).hostname } catch { ref = v.referrer }
      }
      refCounts[ref] = (refCounts[ref] || 0) + 1
    }
    const referrers = Object.entries(refCounts).sort((a, b) => b[1] - a[1]).slice(0, 10)

    // Device
    const deviceCounts: Record<string, number> = {}
    for (const v of views) {
      const d = v.device_type || 'unknown'
      deviceCounts[d] = (deviceCounts[d] || 0) + 1
    }

    // Browser
    const browserCounts: Record<string, number> = {}
    for (const v of views) {
      const b = v.browser || 'other'
      browserCounts[b] = (browserCounts[b] || 0) + 1
    }
    const browsers = Object.entries(browserCounts).sort((a, b) => b[1] - a[1])

    // Country
    const countryCounts: Record<string, number> = {}
    for (const v of views) {
      const c = v.country || '不明'
      countryCounts[c] = (countryCounts[c] || 0) + 1
    }
    const countries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 10)

    return { todayPV, uniqueSessions, dailyData, maxDaily, postRanking, referrers, deviceCounts, browsers, countries }
  }, [views, days])

  const DeviceIcon = ({ type }: { type: string }) => {
    if (type === 'mobile') return <Smartphone className="h-4 w-4" />
    if (type === 'tablet') return <Tablet className="h-4 w-4" />
    return <Monitor className="h-4 w-4" />
  }

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
          <BarChart3 className="h-6 w-6" />
          アクセス解析
        </h1>
        <div className="flex gap-1">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                days === d
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
              }`}
            >
              {d}日
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card label="今日のPV" value={stats.todayPV} icon={<Eye className="h-5 w-5 text-blue-500" />} />
        <Card label={`${days}日間PV`} value={views.length} icon={<BarChart3 className="h-5 w-5 text-green-500" />} />
        <Card label="ユニーク訪問者" value={stats.uniqueSessions} icon={<Users className="h-5 w-5 text-purple-500" />} />
        <Card label="全期間PV" value={totalAllTime} icon={<Globe className="h-5 w-5 text-orange-500" />} />
      </div>

      {/* Daily chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">日別PV</h2>
        <div className="flex items-end gap-[2px]" style={{ height: 120 }}>
          {stats.dailyData.map(d => (
            <div key={d.date} className="group relative flex-1" title={`${d.date}: ${d.count} PV`}>
              <div
                className="w-full rounded-t bg-blue-500 transition-colors group-hover:bg-blue-600"
                style={{ height: `${Math.max(2, (d.count / stats.maxDaily) * 100)}%` }}
              />
              <div className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-[10px] text-white group-hover:block dark:bg-gray-700">
                {d.date.slice(5)}: {d.count}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-gray-400">
          <span>{stats.dailyData[0]?.date.slice(5)}</span>
          <span>{stats.dailyData[stats.dailyData.length - 1]?.date.slice(5)}</span>
        </div>
      </div>

      {/* Post ranking */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">記事別PVランキング</h2>
        {stats.postRanking.length === 0 ? (
          <p className="text-sm text-gray-400">データがありません</p>
        ) : (
          <div className="space-y-2">
            {stats.postRanking.map(([postId, count], i) => {
              const article = articles[postId]
              return (
                <div key={postId} className="flex items-center gap-3">
                  <span className="w-6 text-right text-xs font-medium text-gray-400">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm text-gray-800 dark:text-gray-200">
                      {article?.title || postId.slice(0, 8)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">{count}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Referrer */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">リファラー</h2>
          <div className="space-y-2">
            {stats.referrers.map(([ref, count]) => (
              <div key={ref} className="flex items-center justify-between text-sm">
                <span className="truncate text-gray-600 dark:text-gray-400">{ref}</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Device */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">デバイス別</h2>
          <div className="space-y-2">
            {Object.entries(stats.deviceCounts).map(([type, count]) => (
              <div key={type} className="flex items-center gap-2 text-sm">
                <DeviceIcon type={type} />
                <span className="flex-1 text-gray-600 dark:text-gray-400">{type}</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Browser */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">ブラウザ別</h2>
          <div className="space-y-2">
            {stats.browsers.map(([browser, count]) => (
              <div key={browser} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{browser}</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Country */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">国別</h2>
          <div className="space-y-2">
            {stats.countries.map(([country, count]) => (
              <div key={country} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{country}</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Card({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
    </div>
  )
}
