import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Users, FileText, Eye, PenSquare, Sparkles, TrendingUp,
  Crown, Clock, BarChart3, Shield, ArrowLeft,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const aiLabels: Record<string, string> = {
  generate: '記事生成',
  rewrite: 'リライト',
  suggest: '続き提案',
  seo_analyze: 'SEO分析',
  generate_image: '画像生成',
  suggest_tags: 'タグ提案',
  design: 'デザイン変更',
}

export default async function AdminPage() {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  // Admin check
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean)
  if (!adminIds.includes(user.id)) notFound()

  const db = getSupabaseAdmin()

  // Current month start
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

  // Fetch all data in parallel (nen2 DB contains only nen2 users)
  const [
    totalUsersRes,
    postsRes,
    publishedRes,
    draftRes,
    newUsersMonthRes,
    newUsersWeekRes,
    newUsersTodayRes,
    postsMonthRes,
    postsTodayRes,
    aiMonthRes,
    aiAllRes,
    recentUsersRes,
    recentPostsRes,
    topPostersRes,
    topAiUsersRes,
    allUsersPlansRes,
  ] = await Promise.all([
    db.from('users').select('*', { count: 'exact', head: true }),
    db.from('blog_posts').select('*', { count: 'exact', head: true }),
    db.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    db.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    db.from('users').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
    db.from('users').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
    db.from('users').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
    db.from('blog_posts').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
    db.from('blog_posts').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
    db.from('ai_usage_logs').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
    db.from('ai_usage_logs').select('type').gte('created_at', monthStart),
    db.from('users').select('id, username, display_name, email, plan, ai_credits_remaining, created_at').order('created_at', { ascending: false }).limit(20),
    db.from('blog_posts').select('id, title, status, created_at, user_id, users(username, display_name)').order('created_at', { ascending: false }).limit(20),
    db.from('blog_posts').select('user_id, users(username, display_name)'),
    db.from('ai_usage_logs').select('user_id, users(username, display_name)').gte('created_at', monthStart),
    db.from('users').select('plan'),
  ])

  const totalUsers = (totalUsersRes as any).count || 0
  const totalPosts = (postsRes as any).count || 0
  const publishedPosts = (publishedRes as any).count || 0
  const draftPosts = (draftRes as any).count || 0
  const newUsersMonth = (newUsersMonthRes as any).count || 0
  const newUsersWeek = (newUsersWeekRes as any).count || 0
  const newUsersToday = (newUsersTodayRes as any).count || 0
  const postsMonth = (postsMonthRes as any).count || 0
  const postsToday = (postsTodayRes as any).count || 0
  const aiMonth = (aiMonthRes as any).count || 0

  // AI usage by type
  const aiByType: Record<string, number> = ((aiAllRes as any).data || []).reduce((acc: any, log: any) => {
    acc[log.type] = (acc[log.type] || 0) + 1
    return acc
  }, {})
  const aiMaxCount = Math.max(...Object.values(aiByType) as number[], 1)

  // Top posters
  const posterCounts: Record<string, { count: number; name: string; username: string }> = ((topPostersRes as any).data || []).reduce((acc: any, p: any) => {
    const uid = p.user_id
    if (!acc[uid]) acc[uid] = { count: 0, name: p.users?.display_name || '', username: p.users?.username || '' }
    acc[uid].count++
    return acc
  }, {})
  const topPosters = Object.entries(posterCounts)
    .sort((a, b) => (b[1] as any).count - (a[1] as any).count)
    .slice(0, 10)

  // Top AI users
  const aiUserCounts: Record<string, { count: number; name: string; username: string }> = ((topAiUsersRes as any).data || []).reduce((acc: any, log: any) => {
    const uid = log.user_id
    if (!acc[uid]) acc[uid] = { count: 0, name: log.users?.display_name || '', username: log.users?.username || '' }
    acc[uid].count++
    return acc
  }, {})
  const topAiUsers = Object.entries(aiUserCounts)
    .sort((a, b) => (b[1] as any).count - (a[1] as any).count)
    .slice(0, 10)

  // Plan distribution
  const fullPlanCounts: Record<string, number> = ((allUsersPlansRes as any).data || []).reduce((acc: any, u: any) => {
    acc[u.plan] = (acc[u.plan] || 0) + 1
    return acc
  }, {})

  const recentUsers = (recentUsersRes as any).data || []
  const recentPosts = (recentPostsRes as any).data || []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-red-500" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">NEN2 管理画面</h1>
          </div>
          <Link href="/dashboard" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <ArrowLeft className="h-4 w-4" />
            ダッシュボードへ戻る
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard icon={Users} label="NEN2ユーザー" value={totalUsers} color="blue" />
          <StatCard icon={TrendingUp} label="新規(今月)" value={newUsersMonth} sub={`今週 ${newUsersWeek} / 今日 ${newUsersToday}`} color="green" />
          <StatCard icon={FileText} label="総記事数" value={totalPosts} sub={`今月 ${postsMonth} / 今日 ${postsToday}`} color="indigo" />
          <StatCard icon={Eye} label="公開記事" value={publishedPosts} color="emerald" />
          <StatCard icon={PenSquare} label="下書き" value={draftPosts} color="yellow" />
          <StatCard icon={Sparkles} label="AI利用(今月)" value={aiMonth} color="purple" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Plan Distribution */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <Crown className="h-5 w-5 text-yellow-500" />
              プラン分布
            </h2>
            {Object.keys(fullPlanCounts).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(fullPlanCounts).sort((a, b) => b[1] - a[1]).map(([plan, count]) => (
                  <div key={plan} className="flex items-center gap-3">
                    <span className="w-20 text-sm font-medium capitalize text-gray-600 dark:text-gray-400">{plan}</span>
                    <div className="flex-1">
                      <div className="h-6 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                          className={`h-full rounded-full ${plan === 'pro' ? 'bg-purple-500' : plan === 'business' ? 'bg-yellow-500' : 'bg-blue-500'}`}
                          style={{ width: `${Math.min((count / totalUsers) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-12 text-right text-sm font-bold text-gray-900 dark:text-white">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-gray-400">データなし</p>
            )}
          </div>

          {/* AI Usage by Type */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              AI利用(今月・タイプ別)
            </h2>
            {Object.keys(aiByType).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(aiByType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                  <div key={type} className="flex items-center gap-3">
                    <span className="w-24 text-sm text-gray-600 dark:text-gray-400">{aiLabels[type] || type}</span>
                    <div className="flex-1">
                      <div className="h-6 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div className="h-full rounded-full bg-purple-500" style={{ width: `${(count / aiMaxCount) * 100}%` }} />
                      </div>
                    </div>
                    <span className="w-8 text-right text-sm font-bold text-gray-900 dark:text-white">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-gray-400">データなし</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top Posters */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">投稿数ランキング</h2>
            {topPosters.length > 0 ? (
              <div className="space-y-2">
                {topPosters.map(([uid, info]: [string, any], i) => (
                  <div key={uid} className="flex items-center gap-3">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-400'
                    }`}>{i + 1}</span>
                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                      {info.name} <span className="text-gray-400">@{info.username}</span>
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{info.count}件</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-gray-400">データなし</p>
            )}
          </div>

          {/* Top AI Users */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">AI利用ランキング(今月)</h2>
            {topAiUsers.length > 0 ? (
              <div className="space-y-2">
                {topAiUsers.map(([uid, info]: [string, any], i) => (
                  <div key={uid} className="flex items-center gap-3">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      i === 0 ? 'bg-purple-100 text-purple-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-400'
                    }`}>{i + 1}</span>
                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                      {info.name} <span className="text-gray-400">@{info.username}</span>
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{info.count}回</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-gray-400">データなし</p>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <Users className="h-5 w-5 text-blue-500" />
              NEN2ユーザー一覧
            </h2>
          </div>
          {recentUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">ユーザー名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">表示名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">メール</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">プラン</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">AI残</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">登録日</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentUsers.map((u: any) => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-3 text-sm font-medium text-blue-600 dark:text-blue-400">
                        {u.username ? (
                          <a href={`https://nen2.com/${u.username}`} target="_blank" rel="noopener noreferrer">@{u.username}</a>
                        ) : (
                          <span className="text-gray-400">未設定</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{u.display_name}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{u.email || '—'}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.plan === 'pro' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                          : u.plan === 'business' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}>{u.plan}</span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{u.ai_credits_remaining}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{new Date(u.created_at).toLocaleDateString('ja-JP')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">まだNEN2ユーザーがいません</p>
            </div>
          )}
        </div>

        {/* Recent Posts */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <Clock className="h-5 w-5 text-green-500" />
              最近の記事
            </h2>
          </div>
          {recentPosts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">タイトル</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">著者</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">ステータス</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">作成日</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentPosts.map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="max-w-xs truncate px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">{p.title}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {p.users?.display_name} <span className="text-gray-400">@{p.users?.username}</span>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.status === 'published'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {p.status === 'published' ? '公開' : p.status === 'scheduled' ? '予約' : '下書き'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500">{new Date(p.created_at).toLocaleDateString('ja-JP')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">まだ記事がありません</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: number; sub?: string; color: string
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div className={`mb-2 inline-flex rounded-lg p-2 ${colors[color]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  )
}
