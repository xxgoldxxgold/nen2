import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { callClaude, checkRateLimit, logAIUsage } from '@/lib/ai'
import { NextResponse } from 'next/server'

const AVAILABLE_FONTS = [
  'Noto Sans JP', 'Noto Serif JP', 'M PLUS 1p', 'M PLUS Rounded 1c',
  'Zen Maru Gothic', 'Kosugi Maru', 'Sawarabi Gothic', 'Sawarabi Mincho',
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins',
  'Playfair Display', 'Merriweather',
]

export async function POST(request: Request) {
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const allowed = await checkRateLimit(db, user.id, 'generate_image')
  if (!allowed) return NextResponse.json({ error: 'AI利用回数の上限に達しました' }, { status: 429 })

  const { blogName, prompt } = await request.json()

  try {
    // Step 1: Ask Claude to design the blog
    const designResult = await callClaude(
      `You are a professional blog designer. Based on the blog name and user's design request, suggest a complete blog design.

Available heading fonts: ${AVAILABLE_FONTS.join(', ')}
Available body fonts: ${AVAILABLE_FONTS.join(', ')}

Respond ONLY in valid JSON format (no markdown, no explanation):
{
  "accent_color": "#hexcolor",
  "heading_font": "Font Name",
  "body_font": "Font Name",
  "image_query": "2-4 english keywords for a header photo",
  "reasoning": "1-sentence explanation in Japanese of the design concept"
}

Rules:
- accent_color must be a valid 6-digit hex color
- heading_font and body_font must be from the available fonts list
- heading_font and body_font should be different from each other
- image_query should find a photo that matches the overall design mood
- Consider the blog name and user instructions to create a cohesive design`,
      `ブログ名: ${blogName || 'ブログ'}${prompt ? `\nデザインの要望: ${prompt}` : ''}`,
      300,
    )

    let design: { accent_color: string; heading_font: string; body_font: string; image_query: string; reasoning: string }
    try {
      const cleaned = designResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      design = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'AIデザイン生成に失敗しました。もう一度お試しください。' }, { status: 500 })
    }

    // Validate fonts
    if (!AVAILABLE_FONTS.includes(design.heading_font)) design.heading_font = 'Noto Serif JP'
    if (!AVAILABLE_FONTS.includes(design.body_font)) design.body_font = 'Noto Sans JP'
    if (!/^#[0-9a-fA-F]{6}$/.test(design.accent_color)) design.accent_color = '#5c6b4a'

    // Step 2: Search for header image using the AI-suggested query
    const pexelsKey = process.env.PEXELS_API_KEY
    let headerImageUrl: string | null = null

    if (pexelsKey) {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(design.image_query)}&per_page=5&orientation=landscape`,
        { headers: { Authorization: pexelsKey } },
      )
      if (res.ok) {
        const data = await res.json()
        const photos = data.photos || []
        if (photos.length > 0) {
          const photo = photos[Math.floor(Math.random() * photos.length)]
          headerImageUrl = photo.src.large2x || photo.src.large || photo.src.original
        }
      }
    }

    await logAIUsage(db, user.id, 'generate_image')

    return NextResponse.json({
      accent_color: design.accent_color,
      heading_font: design.heading_font,
      body_font: design.body_font,
      header_image_url: headerImageUrl,
      reasoning: design.reasoning,
    })
  } catch (error) {
    console.error('AI design error:', error)
    return NextResponse.json({ error: 'AIデザイン生成に失敗しました' }, { status: 500 })
  }
}
