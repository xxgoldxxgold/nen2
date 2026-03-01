import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { checkRateLimit, logAIUsage } from '@/lib/ai'
import { generateHeaderSVG } from '@/lib/image-gen'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const allowed = await checkRateLimit(db, user.id, 'generate_header_image')
  if (!allowed) return NextResponse.json({ error: 'AI利用回数の上限に達しました' }, { status: 429 })

  const { blogName, theme, style } = await request.json()
  if (!blogName) return NextResponse.json({ error: 'ブログ名が必要です' }, { status: 400 })

  try {
    const colors = {
      primary: theme?.primary || '#5c6b4a',
      background: theme?.background || '#f5f2ed',
      surface: theme?.surface || '#faf8f5',
      text: theme?.text || '#1f1c18',
    }

    const svg = await generateHeaderSVG(colors, blogName, style)

    // Store as data URI — no Supabase Storage needed
    const imageUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`

    // Update blog_settings
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
        header_photo_credit: undefined,
      },
    }

    await db.from('users').update({ blog_settings: updatedSettings }).eq('id', user.id)

    const { data: userInfo } = await db.from('users').select('username').eq('id', user.id).single()
    if (userInfo?.username) {
      revalidatePath(`/${userInfo.username}`, 'layout')
    }

    await logAIUsage(db, user.id, 'generate_header_image')

    return NextResponse.json({
      imageUrl,
      svg,
      message: 'ヘッダー画像を生成しました',
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Header image generate error:', msg, error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export const maxDuration = 60
