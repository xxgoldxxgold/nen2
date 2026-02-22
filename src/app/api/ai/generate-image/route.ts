import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { checkRateLimit, logAIUsage } from '@/lib/ai'
import { generateCoverSVG, svgToPng, uploadImageToStorage } from '@/lib/image-gen'
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

    // Convert to PNG
    const pngBuffer = await svgToPng(svg, 1200, 630)

    // Upload to Supabase Storage
    const fileName = postId ? `posts/${postId}.png` : `posts/cover-${Date.now()}.png`
    const storagePath = `${user.id}/${fileName}`
    const imageUrl = await uploadImageToStorage(pngBuffer, storagePath)

    await logAIUsage(db, user.id, 'generate_image')

    return NextResponse.json({
      imageUrl,
      message: 'アイキャッチ画像を生成しました',
    })
  } catch (error) {
    console.error('Image generate error:', error)
    return NextResponse.json({ error: '画像生成に失敗しました' }, { status: 500 })
  }
}
