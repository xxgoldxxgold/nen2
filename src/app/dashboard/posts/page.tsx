'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createDataClient } from '@/lib/supabase/data-client'
import Link from 'next/link'
import { PenSquare } from 'lucide-react'
import PostListClient from '@/components/dashboard/PostListClient'
import type { Post } from '@/lib/types'

type PostsData = {
  posts: Post[]
  username: string
}

export default function PostsPage() {
  const [data, setData] = useState<PostsData | null>(null)

  useEffect(() => {
    const load = async () => {
      const auth = createClient()
      const db = createDataClient()
      const { data: { session } } = await auth.auth.getSession()
      if (!session?.user) return

      const uid = session.user.id
      const [{ data: profile }, { data: postData }] = await Promise.all([
        db.from('users').select('username').eq('id', uid).single(),
        db.from('blog_posts').select('*').eq('user_id', uid).order('updated_at', { ascending: false }),
      ])

      const result: PostsData = {
        username: profile?.username || '',
        posts: postData || [],
      }
      setData(result)
    }
    load()
  }, [])

  if (!data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-10 w-28 rounded-lg bg-gray-200 dark:bg-gray-800" />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between border-b border-gray-100 px-6 py-4 last:border-0 dark:border-gray-800">
              <div className="flex-1">
                <div className="h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="mt-2 h-3 w-24 rounded bg-gray-200 dark:bg-gray-800" />
              </div>
              <div className="h-6 w-16 rounded-full bg-gray-200 dark:bg-gray-800" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">記事管理</h1>
        <Link
          href="/dashboard/posts/new"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <PenSquare className="h-4 w-4" />
          新規作成
        </Link>
      </div>

      <PostListClient posts={data.posts} username={data.username} />
    </div>
  )
}
