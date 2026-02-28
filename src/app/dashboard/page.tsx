'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileText, Eye, PenSquare, Globe, ExternalLink, Trash2, Search } from 'lucide-react'
import { formatRelativeDate } from '@/lib/utils'

type DashboardData = {
  profile: any
  posts: any[]
  postCount: number
  publishedCount: number
  draftCount: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const [profRes, postsRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/posts'),
      ])
      if (!profRes.ok) return

      const profData = await profRes.json()
      const allPosts = postsRes.ok ? await postsRes.json() : []

      setData({
        profile: profData,
        posts: allPosts,
        postCount: allPosts.length,
        publishedCount: allPosts.filter((p: any) => p.status === 'published').length,
        draftCount: allPosts.filter((p: any) => p.status === 'draft').length,
      })
    }
    load()
  }, [])

  const handleDelete = async (postId: string) => {
    if (!confirm('この記事を削除しますか？')) return
    setDeleting(postId)
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' })
      if (res.ok && data) {
        setData({
          ...data,
          posts: data.posts.filter(p => p.id !== postId),
          postCount: data.postCount - 1,
          publishedCount: data.publishedCount - (data.posts.find(p => p.id === postId)?.status === 'published' ? 1 : 0),
          draftCount: data.draftCount - (data.posts.find(p => p.id === postId)?.status === 'draft' ? 1 : 0),
        })
      }
    } finally {
      setDeleting(null)
    }
  }

  if (!data) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 w-64 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900" />
          ))}
        </div>
        <div className="h-64 rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900" />
      </div>
    )
  }

  const { profile, posts, postCount, publishedCount, draftCount } = data

  const filteredPosts = posts
    .filter(p => filter === 'all' || p.status === filter)
    .filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            ダッシュボード
          </h1>
          {profile?.username && (
            <a
              href={`/${profile.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400"
            >
              <Globe className="h-3.5 w-3.5" />
              nen2.com/{profile.username}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <Link
          href="/dashboard/new"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <PenSquare className="h-4 w-4" />
          新規記事
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
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
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
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
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
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
      </div>

      {/* Post List */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 px-5 py-3 dark:border-gray-700">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="記事を検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="flex gap-1">
            {(['all', 'published', 'draft'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === f
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {f === 'all' ? 'すべて' : f === 'published' ? '公開' : '下書き'}
              </button>
            ))}
          </div>
        </div>

        {filteredPosts.length > 0 ? (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredPosts.map((post) => (
              <li key={post.id} className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <Link href={`/dashboard/edit/${post.id}`} className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{post.title}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {formatRelativeDate(post.updated_at)}
                    {post.seo_score > 0 && (
                      <span className={`ml-2 ${
                        post.seo_score >= 80 ? 'text-green-600' :
                        post.seo_score >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        SEO: {post.seo_score}
                      </span>
                    )}
                  </p>
                </Link>
                <div className="ml-4 flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    post.status === 'published'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {post.status === 'published' ? '公開' : '下書き'}
                  </span>
                  <button
                    onClick={(e) => { e.preventDefault(); handleDelete(post.id) }}
                    disabled={deleting === post.id}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-6 py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              {search ? '検索結果がありません' : 'まだ記事がありません'}
            </p>
            {!search && (
              <Link
                href="/dashboard/new"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-500"
              >
                <PenSquare className="h-4 w-4" />
                最初の記事を作成する
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
