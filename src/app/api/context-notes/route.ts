import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const db = createDataServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { data, error } = await db
    .from('blog_context_notes')
    .select('*')
    .eq('user_id', user.id)
    .order('category')
    .order('sort_order')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const db = createDataServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { category, title, content } = await request.json()

  if (!category || !title || !content) {
    return NextResponse.json({ error: 'category, title, contentは必須です' }, { status: 400 })
  }

  // Get max sort_order for this category
  const { data: maxOrder } = await db
    .from('blog_context_notes')
    .select('sort_order')
    .eq('user_id', user.id)
    .eq('category', category)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const sortOrder = (maxOrder?.sort_order ?? -1) + 1

  const { data, error } = await db
    .from('blog_context_notes')
    .insert({
      user_id: user.id,
      category,
      title,
      content,
      sort_order: sortOrder,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
