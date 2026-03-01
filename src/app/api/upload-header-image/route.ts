import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(request: Request) {
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'ファイルが必要です' }, { status: 400 })

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'JPEG、PNG、WebPのみ対応しています' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'ファイルサイズは5MB以下にしてください' }, { status: 400 })
  }

  try {
    const arrayBuf = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuf).toString('base64')
    const imageUrl = `data:${file.type};base64,${base64}`

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
        header_image_url: imageUrl,
        header_svg: undefined,
        header_photo_credit: undefined,
      },
    }

    await db.from('users').update({ blog_settings: updatedSettings }).eq('id', user.id)

    const { data: userInfo } = await db.from('users').select('username').eq('id', user.id).single()
    if (userInfo?.username) {
      revalidatePath(`/${userInfo.username}`, 'layout')
    }

    return NextResponse.json({ imageUrl, message: 'ヘッダー画像をアップロードしました' })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Upload header image error:', msg, error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export const maxDuration = 30
