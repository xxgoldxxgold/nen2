import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('user_id')
  if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

  const db = createDataServer()

  const [{ count: followerCount }, { count: followingCount }] = await Promise.all([
    db.from('nen2_follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
    db.from('nen2_follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
  ])

  // Check if current user is following
  let isFollowing = false
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data } = await db
      .from('nen2_follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', userId)
      .maybeSingle()
    isFollowing = !!data
  }

  return NextResponse.json({
    follower_count: followerCount || 0,
    following_count: followingCount || 0,
    is_following: isFollowing,
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { following_id } = await req.json()
  if (!following_id) return NextResponse.json({ error: 'following_id required' }, { status: 400 })
  if (following_id === user.id) return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })

  const db = createDataServer()
  const { error } = await db.from('nen2_follows').insert({
    follower_id: user.id,
    following_id,
  })

  if (error?.code === '23505') {
    return NextResponse.json({ ok: true, already: true })
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { following_id } = await req.json()
  if (!following_id) return NextResponse.json({ error: 'following_id required' }, { status: 400 })

  const db = createDataServer()
  await db.from('nen2_follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', following_id)

  return NextResponse.json({ ok: true })
}
