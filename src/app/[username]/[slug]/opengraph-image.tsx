import { ImageResponse } from 'next/og'
import { getPublicUser, getPublicPost } from '@/lib/supabase/public'
import { renderOGTemplate } from '@/lib/og-templates'
import type { OGTemplateType } from '@/lib/og-templates'

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
  const template: OGTemplateType = settings?.images?.og_template || 'standard'
  const logoUrl = settings?.images?.logo_url

  const jsx = renderOGTemplate(template, {
    title: post.title,
    blogName: user.display_name || username,
    date: post.published_at ? new Date(post.published_at).toLocaleDateString('ja-JP') : undefined,
    colors: {
      primary: settings?.colors?.primary || '#5c6b4a',
      background: settings?.colors?.background || '#f5f2ed',
      surface: settings?.colors?.surface || '#faf8f5',
      text: settings?.colors?.text || '#1f1c18',
      text_muted: settings?.colors?.text_muted || '#8b7d6b',
    },
    logoUrl,
    coverImageUrl: post.cover_image_url || undefined,
  })

  return new ImageResponse(jsx, { ...size })
}
