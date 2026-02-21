'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings`,
    })

    if (error) {
      setError('エラーが発生しました。もう一度お試しください。')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 dark:bg-gray-900">
        <div className="w-full max-w-md space-y-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">メールを送信しました</h2>
          <p className="text-gray-600 dark:text-gray-400">
            <span className="font-medium">{email}</span> にパスワードリセット用のリンクを送信しました。
          </p>
          <Link href="/login" className="inline-block text-sm font-semibold text-blue-600 hover:text-blue-500">
            ログインページへ戻る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 dark:bg-gray-900">
      <Link href="/" className="mb-8 flex items-center gap-2 text-2xl font-bold text-blue-600">
        <Image src="/logo.png" alt="NEN2" width={32} height={32} className="h-8 w-8" />
        NEN2
      </Link>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            パスワードリセット
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            登録済みのメールアドレスを入力してください
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '送信中...' : 'リセットメールを送信'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500">
            ログインページへ戻る
          </Link>
        </p>
      </div>
    </div>
  )
}
