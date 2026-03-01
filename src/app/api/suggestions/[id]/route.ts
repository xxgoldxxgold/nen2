import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const db = createDataServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const newStatus = body.status

  if (!['accepted', 'dismissed', 'completed'].includes(newStatus)) {
    return NextResponse.json({ error: '無効なステータスです' }, { status: 400 })
  }

  // Verify ownership
  const { data: suggestion } = await db
    .from('blog_suggestions')
    .select('id, user_id')
    .eq('id', id)
    .single()

  if (!suggestion || suggestion.user_id !== user.id) {
    return NextResponse.json({ error: '提案が見つかりません' }, { status: 404 })
  }

  const update: Record<string, unknown> = { status: newStatus }
  if (newStatus !== 'open') {
    update.resolved_at = new Date().toISOString()
  }

  const { error } = await db
    .from('blog_suggestions')
    .update(update)
    .eq('id', id)

  if (error) return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 })

  return NextResponse.json({ success: true })
}
