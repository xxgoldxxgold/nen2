import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { checkRateLimit, logAIUsage } from '@/lib/ai'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const allowed = await checkRateLimit(db, user.id, 'generate_image')
  if (!allowed) return NextResponse.json({ error: 'AI利用回数の上限に達しました' }, { status: 429 })

  const { title, content, style } = await request.json()

  try {
    // Placeholder: In production, integrate with DALL-E or Stable Diffusion
    // For now, generate a placeholder image URL using a service like Unsplash
    const query = encodeURIComponent(title || 'blog')
    const imageUrl = `https://source.unsplash.com/1200x630/?${query}`

    await logAIUsage(db, user.id, 'generate_image')

    return NextResponse.json({
      imageUrl,
      message: 'アイキャッチ画像を生成しました（プレースホルダー）',
    })
  } catch (error) {
    console.error('Image generate error:', error)
    return NextResponse.json({ error: '画像生成に失敗しました' }, { status: 500 })
  }
}
