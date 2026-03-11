import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { userId } = await request.json()
  if (!userId) return NextResponse.json({ error: 'userIdが必要です' }, { status: 400 })
  if (userId === user.id) return NextResponse.json({ error: '自分自身はフォローできません' }, { status: 400 })

  const { error } = await db
    .from('user_follows')
    .upsert({ follower_id: user.id, user_id: userId }, { onConflict: 'follower_id,user_id' })

  if (error) return NextResponse.json({ error: '操作に失敗しました' }, { status: 500 })
  return NextResponse.json({ followed: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { userId } = await request.json()
  if (!userId) return NextResponse.json({ error: 'userIdが必要です' }, { status: 400 })

  const { error } = await db
    .from('user_follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: '操作に失敗しました' }, { status: 500 })
  return NextResponse.json({ followed: false })
}

export async function GET(request: Request) {
  const db = createDataServer()
  const url = new URL(request.url)
  const userId = url.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userIdが必要です' }, { status: 400 })

  // Check if current user follows this user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isFollowing = false
  if (user) {
    const { data } = await db
      .from('user_follows')
      .select('follower_id')
      .eq('follower_id', user.id)
      .eq('user_id', userId)
      .single()
    isFollowing = !!data
  }

  const { count } = await db
    .from('user_follows')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  return NextResponse.json({ isFollowing, followerCount: count || 0 })
}
