import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { checkRateLimit, logAIUsage } from '@/lib/ai'
import { generateCoverSVG, uploadImageToStorage } from '@/lib/image-gen'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const allowed = await checkRateLimit(db, user.id, 'generate_image')
  if (!allowed) return NextResponse.json({ error: 'AI利用回数の上限に達しました' }, { status: 429 })

  const { title, content, postId } = await request.json()
  if (!title) return NextResponse.json({ error: 'タイトルが必要です' }, { status: 400 })

  try {
    // Get user's theme colors
    const { data: userData } = await db
      .from('users')
      .select('blog_settings')
      .eq('id', user.id)
      .single()

    const settings = userData?.blog_settings as Record<string, any> | null
    const theme = {
      primary: settings?.colors?.primary || '#5c6b4a',
      background: settings?.colors?.background || '#f5f2ed',
      surface: settings?.colors?.surface || '#faf8f5',
      text: settings?.colors?.text || '#1f1c18',
    }

    // Generate SVG via Claude
    const svg = await generateCoverSVG(theme, title)

    // Upload SVG directly to Supabase Storage (no sharp dependency needed)
    const svgBuffer = Buffer.from(svg, 'utf-8')
    const fileName = postId ? `posts/${postId}.svg` : `posts/cover-${Date.now()}.svg`
    const storagePath = `${user.id}/${fileName}`
    const imageUrl = await uploadImageToStorage(svgBuffer, storagePath, 'image/svg+xml')

    await logAIUsage(db, user.id, 'generate_image')

    return NextResponse.json({
      imageUrl,
      message: 'アイキャッチ画像を生成しました',
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Image generate error:', msg, error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export const maxDuration = 60
