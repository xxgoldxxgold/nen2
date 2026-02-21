'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createDataClient } from '@/lib/supabase/data-client'
import Link from 'next/link'
import { FileText, Eye, Sparkles, PenSquare, Globe, ExternalLink } from 'lucide-react'
import CopyUrlButton from '@/components/dashboard/CopyUrlButton'

type DashboardData = {
  profile: any
  postCount: number
  publishedCount: number
  draftCount: number
  recentPosts: any[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    const load = async () => {
      const auth = createClient()
      const db = createDataClient()
      const { data: { session } } = await auth.auth.getSession()
      if (!session?.user) return

      const uid = session.user.id

      // User provisioning: create nen2 user record if not exists
      let { data: profData } = await db.from('users').select('*').eq('id', uid).single()
      if (!profData) {
        await db.from('users').insert({
          id: uid,
          email: session.user.email,
          display_name: session.user.user_metadata?.display_name || '',
        })
        const res = await db.from('users').select('*').eq('id', uid).single()
        profData = res.data
      }

      const [statuses, recent] = await Promise.all([
        db.from('blog_posts').select('status').eq('user_id', uid),
        db.from('blog_posts').select('id, title, status, created_at, seo_score').eq('user_id', uid).order('updated_at', { ascending: false }).limit(5),
      ])

      const posts = statuses.data || []
      const result: DashboardData = {
        profile: profData,
        postCount: posts.length,
        publishedCount: posts.filter(p => p.status === 'published').length,
        draftCount: posts.filter(p => p.status === 'draft').length,
        recentPosts: recent.data || [],
      }
      setData(result)
    }
    load()
  }, [])

  if (!data) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-64 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="mt-2 h-4 w-48 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
          <div className="h-10 w-36 rounded-lg bg-gray-200 dark:bg-gray-800" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900" />
          ))}
        </div>
        <div className="h-64 rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900" />
      </div>
    )
  }

  const { profile, postCount, publishedCount, draftCount, recentPosts } = data

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            ようこそ、{profile?.display_name || 'ユーザー'}さん
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            ブログの管理と記事の作成ができます
          </p>
        </div>
        <Link
          href="/dashboard/posts/new"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <PenSquare className="h-4 w-4" />
          新規記事を作成
        </Link>
      </div>

      {profile?.username ? (
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-700 dark:bg-gray-900">
          <Globe className="h-5 w-5 text-blue-500" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">あなたのブログURL</p>
            <a
              href={`https://nen2.com/${profile.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              nen2.com/{profile.username}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <CopyUrlButton url={`https://nen2.com/${profile.username}`} />
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-4 dark:border-yellow-900 dark:bg-yellow-900/20">
          <Globe className="h-5 w-5 text-yellow-500" />
          <div className="flex-1">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              ブログを公開するには<Link href="/dashboard/settings" className="font-semibold underline">設定</Link>でユーザー名を設定してください
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">総記事数</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{postCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">公開済み</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{publishedCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <FileText className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">下書き</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{draftCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">AI残り回数</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile?.ai_credits_remaining ?? 10}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">最近の記事</h2>
        </div>
        {recentPosts.length > 0 ? (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentPosts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/dashboard/posts/${post.id}/edit`}
                  className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{post.title}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      {new Date(post.created_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {post.seo_score > 0 && (
                      <span className={`text-sm font-medium ${
                        post.seo_score >= 80 ? 'text-green-600' :
                        post.seo_score >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        SEO: {post.seo_score}
                      </span>
                    )}
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      post.status === 'published'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : post.status === 'scheduled'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {post.status === 'published' ? '公開' : post.status === 'scheduled' ? '予約' : '下書き'}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-6 py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">まだ記事がありません</p>
            <Link
              href="/dashboard/posts/new"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-500"
            >
              <PenSquare className="h-4 w-4" />
              最初の記事を作成する
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
