import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { NextRequest, NextResponse } from 'next/server'

type RouteContext = { params: Promise<{ id: string }> }

// PUT /api/context-notes/[id] — update a context note
export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const body = await request.json()
  const updateData: Record<string, unknown> = {}
  if (body.category !== undefined) updateData.category = body.category
  if (body.title !== undefined) updateData.title = body.title
  if (body.content !== undefined) updateData.content = body.content
  if (body.is_active !== undefined) updateData.is_active = body.is_active
  if (body.sort_order !== undefined) updateData.sort_order = body.sort_order
  updateData.updated_at = new Date().toISOString()

  const { data, error } = await db
    .from('nen2_context_notes')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'ノートが見つかりません' }, { status: 404 })
  return NextResponse.json(data)
}

// DELETE /api/context-notes/[id] — delete a context note
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { error } = await db
    .from('nen2_context_notes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: true })
}
