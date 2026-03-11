import { createDataServer } from '@/lib/supabase/data-server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const db = createDataServer()
  const url = new URL(request.url)

  const sort = url.searchParams.get('sort') || 'newest'
  const category = url.searchParams.get('category')
  const status = url.searchParams.get('status')
  const specId = url.searchParams.get('id')

  // Single spec detail
  if (specId) {
    const { data, error } = await db
      .from('design_specs')
      .select('*, users!inner(username, display_name, avatar_url)')
      .eq('id', specId)
      .single()
    if (error || !data) return NextResponse.json({ error: '仕様書が見つかりません' }, { status: 404 })

    // Check if current user voted
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    let hasVoted = false
    if (user) {
      const { data: vote } = await db
        .from('spec_votes')
        .select('id')
        .eq('spec_id', specId)
        .eq('user_id', user.id)
        .single()
      hasVoted = !!vote
    }

    return NextResponse.json({ spec: data, hasVoted })
  }

  // List specs
  let query = db
    .from('design_specs')
    .select('id, title, summary, category, priority, status, vote_count, created_at, users!inner(username, display_name)')

  if (category) query = query.eq('category', category)
  if (status) query = query.eq('status', status)

  if (sort === 'votes') {
    query = query.order('vote_count', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data, error } = await query.limit(100)
  if (error) return NextResponse.json({ error: '仕様書の取得に失敗しました' }, { status: 500 })

  // Get current user's votes
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let votedSpecIds: string[] = []
  if (user && data && data.length > 0) {
    const { data: votes } = await db
      .from('spec_votes')
      .select('spec_id')
      .eq('user_id', user.id)
      .in('spec_id', data.map((s: any) => s.id))
    votedSpecIds = votes?.map((v: any) => v.spec_id) || []
  }

  return NextResponse.json({ specs: data || [], votedSpecIds })
}
