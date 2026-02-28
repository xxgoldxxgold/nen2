import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { callClaude, checkRateLimit, logAIUsage } from '@/lib/ai'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const allowed = await checkRateLimit(db, user.id, 'generate_image')
  if (!allowed) return NextResponse.json({ error: 'AI利用回数の上限に達しました' }, { status: 429 })

  const { title, prompt } = await request.json()
  if (!title && !prompt) return NextResponse.json({ error: 'タイトルまたは指示が必要です' }, { status: 400 })

  try {
    const userInput = prompt
      ? `Blog title: ${title || 'なし'}\nUser instructions: ${prompt}`
      : `Blog title: ${title}`

    const query = await callClaude(
      'You are a search query generator for stock photos. Based on the blog title and any user instructions about what kind of image they want, output ONLY 2-4 English keywords for finding a stock photo. No explanation, no quotes, just the keywords separated by spaces. Prioritize the user instructions if provided.',
      userInput,
      50,
    )
    const searchQuery = query.trim() || title || prompt

    const pexelsKey = process.env.PEXELS_API_KEY
    if (!pexelsKey) {
      return NextResponse.json({ error: 'PEXELS_API_KEYが設定されていません' }, { status: 500 })
    }

    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=5&orientation=landscape`,
      { headers: { Authorization: pexelsKey } },
    )

    if (!res.ok) throw new Error('Pexels API error')

    const data = await res.json()
    const photos = data.photos || []

    if (photos.length === 0) {
      return NextResponse.json({ error: '画像が見つかりませんでした' }, { status: 404 })
    }

    const photo = photos[Math.floor(Math.random() * photos.length)]
    const imageUrl = photo.src.large2x || photo.src.large || photo.src.original

    await logAIUsage(db, user.id, 'generate_image')

    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error('Image generate error:', error)
    return NextResponse.json({ error: '画像生成に失敗しました' }, { status: 500 })
  }
}
