import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { checkRateLimit, logAIUsage } from '@/lib/ai'
import { generateHeaderSVG, svgToPng, uploadImageToStorage } from '@/lib/image-gen'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const allowed = await checkRateLimit(db, user.id, 'generate_header_image')
  if (!allowed) return NextResponse.json({ error: 'AI利用回数の上限に達しました' }, { status: 429 })

  const { blogName, theme } = await request.json()
  if (!blogName) return NextResponse.json({ error: 'ブログ名が必要です' }, { status: 400 })

  try {
    const colors = {
      primary: theme?.primary || '#5c6b4a',
      background: theme?.background || '#f5f2ed',
      surface: theme?.surface || '#faf8f5',
      text: theme?.text || '#1f1c18',
    }

    // Generate SVG via Claude
    const svg = await generateHeaderSVG(colors, blogName)

    // Convert to PNG
    const pngBuffer = await svgToPng(svg, 1200, 400)

    // Upload to Supabase Storage
    const storagePath = `${user.id}/header.png`
    const imageUrl = await uploadImageToStorage(pngBuffer, storagePath)

    // Update blog_settings with image info
    const { data: userData } = await db
      .from('users')
      .select('blog_settings')
      .eq('id', user.id)
      .single()

    const currentSettings = (userData?.blog_settings || {}) as Record<string, any>
    const updatedSettings = {
      ...currentSettings,
      images: {
        ...currentSettings.images,
        header_svg: svg,
        header_image_url: imageUrl,
      },
    }

    await db.from('users').update({ blog_settings: updatedSettings }).eq('id', user.id)

    await logAIUsage(db, user.id, 'generate_header_image')

    return NextResponse.json({
      imageUrl,
      svg,
      message: 'ヘッダー画像を生成しました',
    })
  } catch (error) {
    console.error('Header image generate error:', error)
    return NextResponse.json({ error: 'ヘッダー画像の生成に失敗しました' }, { status: 500 })
  }
}
