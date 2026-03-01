import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { NextResponse } from 'next/server'

// GET /api/context-notes — list user's context notes
export async function GET() {
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { data, error } = await db
    .from('nen2_context_notes')
    .select('*')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/context-notes — create a new context note
export async function POST(request: Request) {
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const body = await request.json()
  const { category, title, content } = body

  if (!category || !title || !content) {
    return NextResponse.json({ error: 'カテゴリ、タイトル、内容は必須です' }, { status: 400 })
  }

  // Check limit
  const { count } = await db
    .from('nen2_context_notes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { data: profile } = await db.from('profiles').select('plan').eq('id', user.id).single()
  const limits: Record<string, number> = { free: 5, pro: 20, business: 50 }
  const limit = limits[profile?.plan || 'free'] || 5

  if ((count || 0) >= limit) {
    return NextResponse.json({ error: `コンテキストノートの上限（${limit}件）に達しました` }, { status: 429 })
  }

  const { data, error } = await db
    .from('nen2_context_notes')
    .insert({
      user_id: user.id,
      category,
      title,
      content,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
