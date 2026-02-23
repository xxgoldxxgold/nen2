import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { checkRateLimit, logAIUsage } from '@/lib/ai'
import { uploadImageToStorage } from '@/lib/image-gen'
import { searchPexelsPhoto } from '@/lib/pexels'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import sharp from 'sharp'

export async function POST(request: Request) {
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const allowed = await checkRateLimit(db, user.id, 'set_header_photo')
  if (!allowed) return NextResponse.json({ error: 'AI利用回数の上限に達しました' }, { status: 429 })

  const { query } = await request.json()
  if (!query || typeof query !== 'string') {
    return NextResponse.json({ error: '検索キーワードが必要です' }, { status: 400 })
  }

  try {
    // Search Pexels for a landscape photo
    const photo = await searchPexelsPhoto(query)

    // Download the photo
    const photoRes = await fetch(photo.src.landscape)
    if (!photoRes.ok) throw new Error('Failed to download photo from Pexels')
    const photoBuffer = Buffer.from(await photoRes.arrayBuffer())

    // Resize to 1200x400 JPEG
    const jpegBuffer = await sharp(photoBuffer)
      .resize(1200, 400, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toBuffer()

    // Upload to Storage
    const storagePath = `${user.id}/header-photo-${Date.now()}.jpg`
    const imageUrl = await uploadImageToStorage(Buffer.from(jpegBuffer), storagePath, 'image/jpeg')

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
        header_photo_credit: {
          photographer: photo.photographer,
          pexels_url: photo.url,
        },
      },
    }

    await db.from('users').update({ blog_settings: updatedSettings }).eq('id', user.id)

    // Revalidate public blog page
    const { data: userInfo } = await db.from('users').select('username').eq('id', user.id).single()
    if (userInfo?.username) {
      revalidatePath(`/${userInfo.username}`, 'layout')
    }

    await logAIUsage(db, user.id, 'set_header_photo')

    return NextResponse.json({
      imageUrl,
      credit: { photographer: photo.photographer, pexels_url: photo.url },
      message: `写真を設定しました (Photo by ${photo.photographer})`,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Set header photo error:', msg, error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export const maxDuration = 30
