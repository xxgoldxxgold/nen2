import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'

export async function GET(req: NextRequest) {
  const articleId = req.nextUrl.searchParams.get('article_id')
  if (!articleId) return NextResponse.json({ error: 'article_id required' }, { status: 400 })

  const db = createDataServer()
  const { data: comments } = await db
    .from('nen2_comments')
    .select('id, user_id, article_id, body, created_at, updated_at')
    .eq('article_id', articleId)
    .order('created_at', { ascending: true })

  if (!comments || comments.length === 0) return NextResponse.json([])

  const userIds = [...new Set(comments.map(c => c.user_id))]
  const { data: profiles } = await db
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', userIds)
  const profileMap = new Map((profiles || []).map(p => [p.id, p]))

  const result = comments.map(c => {
    const p = profileMap.get(c.user_id)
    return {
      ...c,
      author_name: p?.display_name || '名無し',
      author_avatar_url: p?.avatar_url || null,
    }
  })

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { article_id, body } = await req.json()
  if (!article_id || !body) return NextResponse.json({ error: 'article_id and body required' }, { status: 400 })

  const trimmed = body.trim()
  if (trimmed.length === 0) return NextResponse.json({ error: 'Body cannot be empty' }, { status: 400 })
  if (trimmed.length > 1000) return NextResponse.json({ error: 'Body too long (max 1000)' }, { status: 400 })

  const db = createDataServer()
  const { data, error } = await db.from('nen2_comments').insert({
    user_id: user.id,
    article_id,
    body: trimmed,
  }).select('id, user_id, article_id, body, created_at, updated_at').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Attach author info
  const { data: profile } = await db
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    ...data,
    author_name: profile?.display_name || '名無し',
    author_avatar_url: profile?.avatar_url || null,
  })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const commentId = req.nextUrl.searchParams.get('comment_id')
  if (!commentId) return NextResponse.json({ error: 'comment_id required' }, { status: 400 })

  const db = createDataServer()

  // Only allow deleting own comments
  const { data: comment } = await db
    .from('nen2_comments')
    .select('user_id')
    .eq('id', commentId)
    .single()

  if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
  if (comment.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await db.from('nen2_comments').delete().eq('id', commentId)

  return NextResponse.json({ ok: true })
}
