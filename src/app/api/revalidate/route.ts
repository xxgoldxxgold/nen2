import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  // Require authenticated user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const username = body.username as string | undefined
  const slug = body.slug as string | undefined

  if (!username) {
    return NextResponse.json({ error: 'username is required' }, { status: 400 })
  }

  if (slug) {
    revalidatePath(`/${username}/${slug}`, 'page')
  }

  revalidatePath(`/${username}`, 'layout')

  return NextResponse.json({ revalidated: true })
}
