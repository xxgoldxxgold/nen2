import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'

export async function GET(req: NextRequest) {
  const articleId = req.nextUrl.searchParams.get('article_id')
  if (!articleId) return NextResponse.json({ error: 'article_id required' }, { status: 400 })

  const db = createDataServer()
  const { count } = await db
    .from('nen2_likes')
    .select('*', { count: 'exact', head: true })
    .eq('article_id', articleId)

  let isLiked = false
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data } = await db
      .from('nen2_likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('article_id', articleId)
      .maybeSingle()
    isLiked = !!data
  }

  return NextResponse.json({ like_count: count || 0, is_liked: isLiked })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { article_id } = await req.json()
  if (!article_id) return NextResponse.json({ error: 'article_id required' }, { status: 400 })

  const db = createDataServer()
  const { error } = await db.from('nen2_likes').insert({
    user_id: user.id,
    article_id,
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

  const { article_id } = await req.json()
  if (!article_id) return NextResponse.json({ error: 'article_id required' }, { status: 400 })

  const db = createDataServer()
  await db.from('nen2_likes')
    .delete()
    .eq('user_id', user.id)
    .eq('article_id', article_id)

  return NextResponse.json({ ok: true })
}
