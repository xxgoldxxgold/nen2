'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Script from 'next/script'

const GOOGLE_CLIENT_ID = '444936829523-tucgq0beqmcfh7datarsdvopk4v03a4e.apps.googleusercontent.com'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void
          renderButton: (el: HTMLElement, config: Record<string, unknown>) => void
        }
      }
    }
  }
}

export default function OAuthButtons() {
  const [loading, setLoading] = useState<string | null>(null)
  const googleBtnRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)

  const handleGoogleCredential = useCallback(async (response: { credential: string }) => {
    setLoading('google')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: response.credential,
    })
    if (error) {
      console.error('Google signInWithIdToken error:', error)
    }
    setLoading(null)
  }, [])

  const initGoogle = useCallback(() => {
    if (initializedRef.current || !window.google || !googleBtnRef.current) return
    initializedRef.current = true
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
    })
    window.google.accounts.id.renderButton(googleBtnRef.current, {
      theme: 'outline',
      size: 'large',
      width: 400,
      text: 'continue_with',
      locale: 'ja',
    })
  }, [handleGoogleCredential])

  useEffect(() => {
    if (window.google) initGoogle()
  }, [initGoogle])

  const handleApple = async () => {
    setLoading('apple')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      console.error('Apple OAuth error:', error)
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Script src="https://accounts.google.com/gsi/client" onLoad={initGoogle} />
      <div ref={googleBtnRef} className="flex justify-center" />

      <button
        onClick={handleApple}
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
