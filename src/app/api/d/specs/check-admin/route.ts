import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ADMIN_IDS = [
  '8c4c0d80-4367-4f2b-b202-9ec03b2ac8d6', // x.gold
]

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  if (!ADMIN_IDS.includes(user.id)) return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
  return NextResponse.json({ admin: true })
}
