'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createDataClient } from '@/lib/supabase/data-client'
import { useRouter } from 'next/navigation'
import { Save, User as UserIcon } from 'lucide-react'
import type { User } from '@/lib/types'
import { validateUsername, RESERVED_USERNAMES, MIN_USERNAME_LENGTH } from '@/lib/reserved-usernames'

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState(false)
  const [usernameError, setUsernameError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      const auth = createClient()
      const db = createDataClient()
      const { data: { session } } = await auth.auth.getSession()
      if (!session?.user) { router.push('/login'); return }
      const authUser = session.user

      const { data } = await db
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (data) {
        setUser(data)
        setDisplayName(data.display_name || '')
        setUsername(data.username || '')
        setBio(data.bio || '')
        setAvatarUrl(data.avatar_url || '')
      }
    }
    fetchProfile()
  }, [router])

  const handleUsernameChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
    setUsername(cleaned)
    if (cleaned) {
      setUsernameError(validateUsername(cleaned))
    } else {
      setUsernameError(null)
    }
  }

  const handleSave = async () => {
    const validationError = validateUsername(username)
    if (validationError) {
      setMessage(validationError)
      return
    }

    setSaving(true)
    setMessage(null)

    const db = createDataClient()
    const { error } = await db
      .from('users')
      .update({
        display_name: displayName,
        username,
        bio,
        avatar_url: avatarUrl || null,
      })
      .eq('id', user!.id)

    if (error) {
      if (error.message.includes('unique') || error.message.includes('duplicate')) {
        setMessage('このユーザー名は既に使用されています')
      } else {
        setMessage('保存に失敗しました: ' + error.message)
      }
    } else {
      setMessage('保存しました')
      setUsernameError(null)
    }

    setSaving(false)
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">アカウント設定</h1>

      {message && (
        <div className={`rounded-lg p-3 text-sm ${
          message === '保存しました'
            ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
        }`}>
          {message}
        </div>
      )}

      <div className="max-w-2xl space-y-6">
        {/* Profile Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">プロフィール</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                {avatarUrl && !avatarError ? (
                  <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" onError={() => setAvatarError(true)} />
                ) : (
                  <UserIcon className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">アイコンURL</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => { setAvatarUrl(e.target.value); setAvatarError(false) }}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">表示名</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ユーザー名</label>
              <div className="mt-1 flex items-center">
                <span className="rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  nen2.com/
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  className={`w-full rounded-r-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:text-white ${
                    usernameError
                      ? 'border-red-400 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  maxLength={30}
                  minLength={MIN_USERNAME_LENGTH}
                />
              </div>
              {usernameError && (
                <p className="mt-1 text-xs text-red-500">{usernameError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">自己紹介</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="あなたのブログについて紹介してください"
              />
            </div>
          </div>
        </div>

        {/* Plan Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">プラン</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                現在のプラン: <span className="capitalize">{user.plan}</span>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                AI残り回数: {user.ai_credits_remaining}回/月
              </p>
            </div>
            {user.plan === 'free' && (
              <button className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white hover:from-blue-700 hover:to-purple-700">
                Proにアップグレード
              </button>
            )}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !!usernameError}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? '保存中...' : '設定を保存'}
        </button>
      </div>
    </div>
  )
}
