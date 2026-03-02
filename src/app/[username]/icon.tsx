import { ImageResponse } from 'next/og'
import { getPublicUser } from '@/lib/supabase/public'

export const runtime = 'nodejs'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default async function Icon({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const user = await getPublicUser(decodeURIComponent(username))

  if (!user) {
    return new ImageResponse(
      <div style={{ display: 'flex', width: 32, height: 32, background: '#666', borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 18, color: '#fff', fontWeight: 700 }}>?</span>
      </div>,
      { ...size }
    )
  }

  const settings = user.blog_settings as Record<string, any> | null

  // Custom favicon takes priority
  const customFavicon = settings?.images?.favicon_url
  if (customFavicon) {
    return new ImageResponse(
      <div style={{ display: 'flex', width: 32, height: 32 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={customFavicon} alt="" width={32} height={32} style={{ borderRadius: 4, objectFit: 'contain' }} />
      </div>,
      { ...size }
    )
  }

  // Auto-generate: first character + primary color
  const primary = settings?.colors?.primary || '#5c6b4a'
  const displayName = user.display_name || username
  const firstChar = displayName.charAt(0).toUpperCase()

  return new ImageResponse(
    <div style={{
      display: 'flex',
      width: 32,
      height: 32,
      background: primary,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <span style={{ fontSize: 18, color: '#ffffff', fontWeight: 700 }}>{firstChar}</span>
    </div>,
    { ...size }
  )
}
