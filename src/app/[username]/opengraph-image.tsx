import { ImageResponse } from 'next/og'
import { getPublicUser } from '@/lib/supabase/public'
import { renderOGTemplate } from '@/lib/og-templates'
import type { OGTemplateType } from '@/lib/og-templates'

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
  const rawTemplate: OGTemplateType = settings?.images?.og_template || 'standard'
  // Blog top only uses standard, bold, gradient (others fall back to standard)
  const template: OGTemplateType = ['standard', 'bold', 'gradient'].includes(rawTemplate) ? rawTemplate : 'standard'
  const logoUrl = settings?.images?.logo_url

  const blogTitle = `${user.display_name || username}のブログ`

  const jsx = renderOGTemplate(template, {
    title: blogTitle,
    blogName: user.display_name || username,
    date: undefined,
    excerpt: user.bio?.slice(0, 100),
    colors: {
      primary: settings?.colors?.primary || '#5c6b4a',
      background: settings?.colors?.background || '#f5f2ed',
      surface: settings?.colors?.surface || '#faf8f5',
      text: settings?.colors?.text || '#1f1c18',
      text_muted: settings?.colors?.text_muted || '#8b7d6b',
    },
    logoUrl,
  })

  return new ImageResponse(jsx, { ...size })
}
