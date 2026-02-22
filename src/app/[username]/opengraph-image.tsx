import { ImageResponse } from 'next/og'
import { getPublicUser } from '@/lib/supabase/public'

export const runtime = 'nodejs'
export const alt = 'ブログ OGP画像'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const user = await getPublicUser(decodeURIComponent(username))

  if (!user) {
    return new ImageResponse(
      <div style={{ display: 'flex', width: '100%', height: '100%', background: '#f5f2ed', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 32, color: '#666' }}>Blog not found</p>
      </div>,
      { ...size }
    )
  }

  const settings = user.blog_settings as Record<string, any> | null
  const primary = settings?.colors?.primary || '#5c6b4a'
  const bg = settings?.colors?.background || '#f5f2ed'
  const text = settings?.colors?.text || '#1f1c18'
  const textMuted = settings?.colors?.text_muted || '#8b7d6b'

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: bg,
        position: 'relative',
      }}
    >
      {/* Decorative shapes */}
      <div style={{
        position: 'absolute', top: -60, right: -60,
        width: 300, height: 300, borderRadius: '50%',
        background: primary, opacity: 0.1,
        display: 'flex',
      }} />
      <div style={{
        position: 'absolute', bottom: -40, left: -40,
        width: 200, height: 200, borderRadius: '50%',
        background: primary, opacity: 0.08,
        display: 'flex',
      }} />
      <div style={{
        position: 'absolute', top: 80, left: 60,
        width: 8, height: 120,
        background: primary, opacity: 0.3,
        display: 'flex',
      }} />

      {/* Content */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        flex: 1, padding: '60px 80px',
      }}>
        <div style={{
          fontSize: 56, fontWeight: 700, color: text,
          textAlign: 'center', lineHeight: 1.3,
          display: 'flex',
        }}>
          {user.display_name}のブログ
        </div>
        {user.bio && (
          <div style={{
            fontSize: 24, color: textMuted,
            textAlign: 'center', marginTop: 24,
            maxWidth: 800,
            display: 'flex',
          }}>
            {user.bio.slice(0, 100)}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px 0', borderTop: `3px solid ${primary}`,
      }}>
        <div style={{ fontSize: 18, color: textMuted, display: 'flex' }}>
          Powered by NEN2
        </div>
      </div>
    </div>,
    { ...size }
  )
}
