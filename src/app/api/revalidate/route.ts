import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const db = createDataServer()
  const { data } = await db
    .from('users')
    .select('username')
    .eq('id', user.id)
    .single()

  if (data?.username) {
    revalidatePath(`/${data.username}`, 'layout')
  }

  return NextResponse.json({ ok: true })
}
