import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { checkRateLimit, logAIUsage } from '@/lib/ai'
import { generateFaviconSVG } from '@/lib/image-gen'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const allowed = await checkRateLimit(db, user.id, 'generate_image')
  if (!allowed) return NextResponse.json({ error: 'AI利用回数の上限に達しました' }, { status: 429 })

  const { blogName, style } = await request.json()
  if (!blogName) return NextResponse.json({ error: 'ブログ名が必要です' }, { status: 400 })

  try {
    const { data: userData } = await db
      .from('users')
      .select('blog_settings')
      .eq('id', user.id)
      .single()

    const settings = userData?.blog_settings as Record<string, any> | null
    const theme = {
      primary: settings?.colors?.primary || '#5c6b4a',
      background: settings?.colors?.background || '#f5f2ed',
    }

    const svg = await generateFaviconSVG(theme, blogName, style)
    const imageUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`

    // Save to blog_settings
    const currentSettings = (userData?.blog_settings || {}) as Record<string, any>
    const updatedSettings = {
      ...currentSettings,
      images: {
        ...currentSettings.images,
        favicon_url: imageUrl,
      },
    }

    await db.from('users').update({ blog_settings: updatedSettings }).eq('id', user.id)

    const { data: userInfo } = await db.from('users').select('username').eq('id', user.id).single()
    if (userInfo?.username) {
      revalidatePath(`/${userInfo.username}`, 'layout')
    }

    await logAIUsage(db, user.id, 'generate_image')

    return NextResponse.json({
      imageUrl,
      message: 'ファビコンを生成しました',
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Favicon generate error:', msg, error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export const maxDuration = 60
