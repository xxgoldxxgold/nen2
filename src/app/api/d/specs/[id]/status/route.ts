import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { NextResponse } from 'next/server'

// Admin user IDs (add your admin user IDs here)
const ADMIN_IDS = [
  '8c4c0d80-4367-4f2b-b202-9ec03b2ac8d6', // x.gold
]

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  const { id: specId } = await context.params
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  if (!ADMIN_IDS.includes(user.id)) {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
  }

  const { status } = await request.json()
  if (!['new', 'adopted', 'rejected'].includes(status)) {
    return NextResponse.json({ error: '無効なステータスです' }, { status: 400 })
  }

  const { error } = await db
    .from('design_specs')
    .update({ status })
    .eq('id', specId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, status })
}
