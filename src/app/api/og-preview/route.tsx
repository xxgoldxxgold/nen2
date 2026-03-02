import { ImageResponse } from 'next/og'
import { renderOGTemplate } from '@/lib/og-templates'
import type { OGTemplateType } from '@/lib/og-templates'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

const size = { width: 1200, height: 630 }

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const template = (sp.get('template') || 'standard') as OGTemplateType
  const title = sp.get('title') || 'サンプル記事タイトル'
  const blogName = sp.get('blogName') || 'My Blog'
  const primary = sp.get('primary') || '#5c6b4a'
  const background = sp.get('background') || '#f5f2ed'
  const surface = sp.get('surface') || '#faf8f5'
  const text = sp.get('text') || '#1f1c18'
  const textMuted = sp.get('textMuted') || '#8b7d6b'

  const jsx = renderOGTemplate(template, {
    title,
    blogName,
    date: '2025年1月15日',
    colors: { primary, background, surface, text, text_muted: textMuted },
  })

  return new ImageResponse(jsx, {
    ...size,
    headers: { 'Cache-Control': 'public, max-age=300' },
  })
}
