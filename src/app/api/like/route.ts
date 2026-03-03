import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { postId } = await request.json()
  if (!postId) return NextResponse.json({ error: 'postIdが必要です' }, { status: 400 })

  const { error } = await db
    .from('post_likes')
    .upsert({ user_id: user.id, post_id: postId }, { onConflict: 'user_id,post_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ liked: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { postId } = await request.json()
  if (!postId) return NextResponse.json({ error: 'postIdが必要です' }, { status: 400 })

  const { error } = await db
    .from('post_likes')
    .delete()
    .eq('user_id', user.id)
    .eq('post_id', postId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ liked: false })
}

export async function GET(request: Request) {
  const db = createDataServer()
  const url = new URL(request.url)
  const postId = url.searchParams.get('postId')
  if (!postId) return NextResponse.json({ error: 'postIdが必要です' }, { status: 400 })

  // Check if current user liked this post
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isLiked = false
  if (user) {
    const { data } = await db
      .from('post_likes')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .single()
    isLiked = !!data
  }

  const { count } = await db
    .from('post_likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)

  return NextResponse.json({ isLiked, likeCount: count || 0 })
}
