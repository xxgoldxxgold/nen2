import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { NextResponse } from 'next/server'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(_request: Request, context: RouteContext) {
  const { id: specId } = await context.params
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  // Check if already voted
  const { data: existing } = await db
    .from('spec_votes')
    .select('id')
    .eq('spec_id', specId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    // Remove vote (toggle off)
    await db.from('spec_votes').delete().eq('id', existing.id)
    // Recount
    const { count } = await db.from('spec_votes').select('*', { count: 'exact', head: true }).eq('spec_id', specId)
    await db.from('design_specs').update({ vote_count: count || 0 }).eq('id', specId)
    return NextResponse.json({ voted: false, voteCount: count || 0 })
  } else {
    // Add vote (toggle on)
    const { error } = await db.from('spec_votes').insert({ spec_id: specId, user_id: user.id })
    if (error) return NextResponse.json({ error: '投票に失敗しました' }, { status: 500 })
    // Recount
    const { count } = await db.from('spec_votes').select('*', { count: 'exact', head: true }).eq('spec_id', specId)
    await db.from('design_specs').update({ vote_count: count || 0 }).eq('id', specId)
    return NextResponse.json({ voted: true, voteCount: count || 0 })
  }
}
