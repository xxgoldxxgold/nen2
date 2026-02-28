'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'

function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /Line\/|FBAN|FBAV|Instagram|Twitter|MicroMessenger|WeChat|TikTok/i.test(ua)
    || (/iPhone|iPad|iPod/.test(ua) && !/Safari/i.test(ua))
}

export default function OAuthButtons() {
  const [loading, setLoading] = useState<string | null>(null)
  const [inApp, setInApp] = useState(false)

  useEffect(() => {
    setInApp(isInAppBrowser())
  }, [])

  const openInSystemBrowser = () => {
    const url = window.location.href
    // iOSではx-safari-httpsスキームでSafariを開く。動かない場合はコピー案内になる
    window.location.href = `x-safari-https://${url.replace(/^https?:\/\//, '')}`
    // フォールバック: 一定時間後もページにいる場合は何もしない（案内文を見てもらう）
  }

  const handleOAuth = async (provider: 'google' | 'apple') => {
    if (inApp) {
      openInSystemBrowser()
      return
    }
    setLoading(provider)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      console.error(`${provider} OAuth error:`, error)
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {inApp && (
        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          <p className="font-semibold">アプリ内ブラウザでは利用できません</p>
          <p className="mt-1">Google/Appleログインを使うには、SafariまたはChromeで開いてください。</p>
          <button
            onClick={openInSystemBrowser}
            className="mt-2 w-full rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            Safariで開く
          </button>
        </div>
      )}
      <button
        onClick={() => handleOAuth('google')}
        disabled={loading !== null}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        {loading === 'google' ? '接続中...' : 'Googleで続ける'}
      </button>

      <button
        onClick={() => handleOAuth('apple')}
        disabled={loading !== null}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-black px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-900 disabled:opacity-50"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
        </svg>
        {loading === 'apple' ? '接続中...' : 'Appleで続ける'}
      </button>
    </div>
  )
}
