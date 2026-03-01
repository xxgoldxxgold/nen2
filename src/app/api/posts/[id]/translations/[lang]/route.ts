import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; lang: string }> }
) {
  const supabase = await createClient()
  const db = createDataServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { id: postId, lang } = await params

  const { data: translation } = await db
    .from('blog_post_translations')
    .select('*')
    .eq('post_id', postId)
    .eq('language_code', lang)
    .single()

  if (!translation || translation.user_id !== user.id) {
    return NextResponse.json({ error: '翻訳が見つかりません' }, { status: 404 })
  }

  return NextResponse.json(translation)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; lang: string }> }
) {
  const supabase = await createClient()
  const db = createDataServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { id: postId, lang } = await params
  const body = await request.json()

  const { data: existing } = await db
    .from('blog_post_translations')
    .select('id, user_id, published_at')
    .eq('post_id', postId)
    .eq('language_code', lang)
    .single()

  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: '翻訳が見つかりません' }, { status: 404 })
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.title !== undefined) update.title = body.title
  if (body.content_html !== undefined) update.content_html = body.content_html
  if (body.excerpt !== undefined) update.excerpt = body.excerpt
  if (body.meta_description !== undefined) update.meta_description = body.meta_description
  if (body.status !== undefined) {
    update.status = body.status
    if (body.status === 'published' && !existing.published_at) {
      update.published_at = new Date().toISOString()
    }
  }

  const { error } = await db
    .from('blog_post_translations')
    .update(update)
    .eq('id', existing.id)

  if (error) return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; lang: string }> }
) {
  const supabase = await createClient()
  const db = createDataServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { id: postId, lang } = await params

  const { data: existing } = await db
    .from('blog_post_translations')
    .select('id, user_id')
    .eq('post_id', postId)
    .eq('language_code', lang)
    .single()

  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: '翻訳が見つかりません' }, { status: 404 })
  }

  await db.from('blog_post_translations').delete().eq('id', existing.id)
  return NextResponse.json({ success: true })
}
