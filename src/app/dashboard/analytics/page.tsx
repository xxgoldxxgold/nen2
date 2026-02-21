'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createDataClient } from '@/lib/supabase/data-client'
import { BarChart3 } from 'lucide-react'

const labels: Record<string, string> = {
  generate: '記事生成',
  rewrite: 'リライト',
  suggest: '続き提案',
  seo_analyze: 'SEO分析',
  generate_image: '画像生成',
  suggest_tags: 'タグ提案',
  design: 'デザイン変更',
}

type AnalyticsData = {
  totalPosts: number
  publishedPosts: number
  aiTotal: number
  aiUsageByType: Record<string, number>
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    const load = async () => {
      const auth = createClient()
      const db = createDataClient()
      const { data: { session } } = await auth.auth.getSession()
      if (!session?.user) return

      const uid = session.user.id
      const [statuses, logs] = await Promise.all([
        db.from('blog_posts').select('status').eq('user_id', uid),
        db.from('ai_usage_logs').select('type').eq('user_id', uid).order('created_at', { ascending: false }).limit(50),
      ])

      const posts = statuses.data || []
      const byType = (logs.data || []).reduce<Record<string, number>>((acc, log) => {
        acc[log.type] = (acc[log.type] || 0) + 1
        return acc
      }, {})

      const result: AnalyticsData = {
        totalPosts: posts.length,
        publishedPosts: posts.filter(p => p.status === 'published').length,
        aiTotal: logs.data?.length || 0,
        aiUsageByType: byType,
      }
      setData(result)
    }
    load()
  }, [])

  if (!data) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900" />
          ))}
        </div>
        <div className="h-48 rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900" />
      </div>
    )
  }

  const { totalPosts, publishedPosts, aiTotal, aiUsageByType } = data
  const maxCount = Math.max(...Object.values(aiUsageByType), 1)

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">アクセス解析</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500">総記事数</p>
          <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{totalPosts}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500">公開済み</p>
          <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{publishedPosts}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500">AI利用回数（今月）</p>
          <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{aiTotal}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">AI機能利用状況</h2>
        {Object.keys(aiUsageByType).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(aiUsageByType).map(([type, count]) => (
              <div key={type} className="flex items-center gap-3">
                <span className="w-24 text-sm text-gray-600 dark:text-gray-400">{labels[type] || type}</span>
                <div className="flex-1">
                  <div className="h-6 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${Math.min((count / maxCount) * 100, 100)}%` }}
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
