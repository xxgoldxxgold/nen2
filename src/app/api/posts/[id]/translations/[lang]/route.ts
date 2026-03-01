import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { NextRequest, NextResponse } from 'next/server'

type RouteContext = { params: Promise<{ id: string; lang: string }> }

// GET /api/posts/[id]/translations/[lang] — get translation detail
export async function GET(request: NextRequest, context: RouteContext) {
  const { id, lang } = await context.params
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { data: post } = await db.from('articles').select('id').eq('id', id).eq('user_id', user.id).single()
  if (!post) return NextResponse.json({ error: '記事が見つかりません' }, { status: 404 })

  const { data, error } = await db
    .from('nen2_post_translations')
    .select('*')
    .eq('post_id', id)
    .eq('language_code', lang)
    .single()

  if (error || !data) return NextResponse.json({ error: '翻訳が見つかりません' }, { status: 404 })
  return NextResponse.json(data)
}

// PUT /api/posts/[id]/translations/[lang] — update translation
export async function PUT(request: NextRequest, context: RouteContext) {
  const { id, lang } = await context.params
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { data: post } = await db.from('articles').select('id').eq('id', id).eq('user_id', user.id).single()
  if (!post) return NextResponse.json({ error: '記事が見つかりません' }, { status: 404 })

  const body = await request.json()
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (body.title !== undefined) updateData.title = body.title
  if (body.content !== undefined) updateData.content = body.content
  if (body.meta_description !== undefined) updateData.meta_description = body.meta_description
  if (body.status !== undefined) {
    updateData.status = body.status
    if (body.status === 'published') updateData.published_at = new Date().toISOString()
  }

  const { data, error } = await db
    .from('nen2_post_translations')
    .update(updateData)
    .eq('post_id', id)
    .eq('language_code', lang)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
