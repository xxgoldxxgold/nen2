import { ImageResponse } from 'next/og'
import { getPublicUser, getPublicPost } from '@/lib/supabase/public'

export const runtime = 'nodejs'
export const alt = '記事 OGP画像'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage({ params }: { params: Promise<{ username: string; slug: string }> }) {
  const { username, slug } = await params
  const user = await getPublicUser(decodeURIComponent(username))

  if (!user) {
    return new ImageResponse(
      <div style={{ display: 'flex', width: '100%', height: '100%', background: '#f5f2ed', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 32, color: '#666' }}>Not found</p>
      </div>,
      { ...size }
    )
  }

  const post = await getPublicPost(user.id, decodeURIComponent(slug))

  if (!post) {
    return new ImageResponse(
      <div style={{ display: 'flex', width: '100%', height: '100%', background: '#f5f2ed', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 32, color: '#666' }}>Post not found</p>
      </div>,
      { ...size }
    )
  }

  const settings = user.blog_settings as Record<string, any> | null
  const primary = settings?.colors?.primary || '#5c6b4a'
  const bg = settings?.colors?.background || '#f5f2ed'
  const text = settings?.colors?.text || '#1f1c18'
  const textMuted = settings?.colors?.text_muted || '#8b7d6b'

  // If post has cover image, use metadata-based OGP (already set in generateMetadata)
  // This route provides a fallback dynamic image using theme colors

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
        position: 'absolute', top: -80, right: -80,
        width: 350, height: 350, borderRadius: '50%',
        background: primary, opacity: 0.1,
        display: 'flex',
      }} />
      <div style={{
        position: 'absolute', bottom: -50, left: -50,
        width: 250, height: 250, borderRadius: '50%',
        background: primary, opacity: 0.06,
        display: 'flex',
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: '100%', height: 6,
        background: primary,
        display: 'flex',
      }} />

      {/* Content */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center',
        flex: 1, padding: '60px 80px',
      }}>
        <div style={{
          fontSize: 48, fontWeight: 700, color: text,
          lineHeight: 1.3,
          display: 'flex',
          maxWidth: 1000,
        }}>
          {post.title.length > 60 ? post.title.slice(0, 60) + '...' : post.title}
        </div>
        {post.excerpt && (
          <div style={{
            fontSize: 22, color: textMuted,
            marginTop: 20,
            maxWidth: 900,
            display: 'flex',
          }}>
            {post.excerpt.slice(0, 120)}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '24px 80px',
        borderTop: `2px solid ${primary}20`,
      }}>
        <div style={{ fontSize: 20, color: textMuted, display: 'flex' }}>
          {user.display_name}
        </div>
        {post.published_at && (
          <div style={{ fontSize: 18, color: textMuted, display: 'flex' }}>
            {new Date(post.published_at).toLocaleDateString('ja-JP')}
          </div>
        )}
      </div>
    </div>,
    { ...size }
  )
}
