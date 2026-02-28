'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Save, User as UserIcon, Palette, Sparkles } from 'lucide-react'
import { AVAILABLE_FONTS, DEFAULT_THEME } from '@/lib/theme'
import { validateUsername, MIN_USERNAME_LENGTH } from '@/lib/reserved-usernames'

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [accentColor, setAccentColor] = useState(DEFAULT_THEME.accent_color)
  const [headingFont, setHeadingFont] = useState(DEFAULT_THEME.heading_font)
  const [bodyFont, setBodyFont] = useState(DEFAULT_THEME.body_font)
  const [headerImageUrl, setHeaderImageUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState(false)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [aiDesignLoading, setAiDesignLoading] = useState(false)
  const [designPrompt, setDesignPrompt] = useState('')
  const [designReasoning, setDesignReasoning] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await fetch('/api/profile')
      if (!res.ok) { router.push('/login'); return }
      const data = await res.json()
      setProfile(data)
      setDisplayName(data.display_name || '')
      setUsername(data.username || '')
      setBio(data.bio || '')
      setAvatarUrl(data.avatar_url || '')
      setAccentColor(data.accent_color || DEFAULT_THEME.accent_color)
      setHeadingFont(data.heading_font || DEFAULT_THEME.heading_font)
      setBodyFont(data.body_font || DEFAULT_THEME.body_font)
      setHeaderImageUrl(data.header_image_url || '')
    }
    fetchProfile()
  }, [router])

  const handleUsernameChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
    setUsername(cleaned)
    setUsernameError(cleaned ? validateUsername(cleaned) : null)
  }

  const handleSave = async () => {
    const validationError = validateUsername(username)
    if (validationError) { setMessage(validationError); return }

    setSaving(true)
    setMessage(null)

    const oldUsername = profile?.username
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_name: displayName,
        username,
        bio,
        avatar_url: avatarUrl || null,
        accent_color: accentColor,
        heading_font: headingFont,
        body_font: bodyFont,
        header_image_url: headerImageUrl || null,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setMessage(err.error || '保存に失敗しました')
      setSaving(false)
      return
    }

    const updated = await res.json()
    if (!updated || !updated.username) {
      setMessage('保存に失敗しました（レスポンスが空です）')
      setSaving(false)
      return
    }

    // Sync all state from saved data
    setProfile(updated)
    setDisplayName(updated.display_name || '')
    setUsername(updated.username || '')
    setBio(updated.bio || '')
    setAvatarUrl(updated.avatar_url || '')
    setAccentColor(updated.accent_color || DEFAULT_THEME.accent_color)
    setHeadingFont(updated.heading_font || DEFAULT_THEME.heading_font)
    setBodyFont(updated.body_font || DEFAULT_THEME.body_font)
    setHeaderImageUrl(updated.header_image_url || '')
    setMessage(`保存しました ✓ ブログURL: nen2.com/${updated.username}`)
    setUsernameError(null)

    // Revalidate public pages (old and new username if changed)
    fetch('/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: updated.username }),
    }).catch(() => {})
    if (oldUsername && oldUsername !== updated.username) {
      fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: oldUsername }),
      }).catch(() => {})
    }

    setSaving(false)
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">設定</h1>

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
                    usernameError ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  maxLength={30}
                  minLength={MIN_USERNAME_LENGTH}
                />
              </div>
              {usernameError && <p className="mt-1 text-xs text-red-500">{usernameError}</p>}
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

        {/* Design Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">デザイン</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">アクセントカラー</label>
              <div className="mt-1 flex items-center gap-3">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border border-gray-300 dark:border-gray-600"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  maxLength={7}
                />
                <div className="h-8 w-8 rounded-full border" style={{ backgroundColor: accentColor }} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">見出しフォント</label>
              <select
                value={headingFont}
                onChange={(e) => setHeadingFont(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                {AVAILABLE_FONTS.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">本文フォント</label>
              <select
                value={bodyFont}
                onChange={(e) => setBodyFont(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                {AVAILABLE_FONTS.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ヘッダー画像URL</label>
              <input
                type="url"
                value={headerImageUrl}
                onChange={(e) => setHeaderImageUrl(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="https://..."
              />
              {headerImageUrl && (
                <img src={headerImageUrl} alt="Header preview" className="mt-2 h-24 w-full rounded-lg object-cover" />
              )}
            </div>

            {/* AI Design */}
            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">AIデザイン</label>
              <input
                type="text"
                value={designPrompt}
                onChange={(e) => setDesignPrompt(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="どんなデザインにしたい？（例: モダンでクール、ナチュラルで温かい雰囲気、和風）"
              />
              <button
                onClick={async () => {
                  setAiDesignLoading(true)
                  setDesignReasoning(null)
                  setMessage(null)
                  try {
                    const res = await fetch('/api/ai/design', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        blogName: displayName ? `${displayName}のブログ` : 'ブログ',
                        prompt: designPrompt,
                      }),
                    })
                    const data = await res.json()
                    if (data.error) { setMessage(data.error); setAiDesignLoading(false); return }

                    // Apply design to form
                    const newAccent = data.accent_color || accentColor
                    const newHeading = data.heading_font || headingFont
                    const newBody = data.body_font || bodyFont
                    const newHeader = data.header_image_url || headerImageUrl
                    setAccentColor(newAccent)
                    setHeadingFont(newHeading)
                    setBodyFont(newBody)
                    if (data.header_image_url) setHeaderImageUrl(data.header_image_url)
                    if (data.reasoning) setDesignReasoning(data.reasoning)

                    // Auto-save the design
                    const saveRes = await fetch('/api/profile', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        display_name: displayName,
                        username,
                        bio,
                        avatar_url: avatarUrl || null,
                        accent_color: newAccent,
                        heading_font: newHeading,
                        body_font: newBody,
                        header_image_url: newHeader || null,
                      }),
                    })
                    if (saveRes.ok) {
                      const updated = await saveRes.json()
                      setProfile(updated)
                      setMessage('AIデザインを適用・保存しました')
                      await fetch('/api/revalidate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username }),
                      })
                    }
                  } catch {
                    setMessage('AIデザイン生成に失敗しました')
                  } finally {
                    setAiDesignLoading(false)
                  }
                }}
                disabled={aiDesignLoading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-purple-50 px-4 py-2.5 text-sm font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50 dark:bg-purple-900/20 dark:text-purple-400"
              >
                <Sparkles className="h-4 w-4" />
                {aiDesignLoading ? 'デザイン生成中...' : 'AIでデザインを変更する'}
              </button>
              {designReasoning && (
                <p className="mt-2 rounded-lg bg-purple-50 px-3 py-2 text-xs text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                  {designReasoning}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Plan Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">プラン</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                現在のプラン: <span className="capitalize">{profile.plan}</span>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                AI残り回数: {profile.ai_credits_remaining}回/月
              </p>
            </div>
            {profile.plan === 'free' && (
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
