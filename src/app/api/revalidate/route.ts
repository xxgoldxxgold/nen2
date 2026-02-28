import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))

  // Secret-based purge: revalidate all user pages without auth
  const secret = body.secret as string | undefined
  if (secret === process.env.REVALIDATE_SECRET) {
    const db = createDataServer()
    const { data: profiles } = await db.from('profiles').select('username')
    if (profiles) {
      for (const p of profiles) {
        revalidatePath(`/${p.username}`, 'layout')
      }
    }
    return NextResponse.json({ revalidated: true, count: profiles?.length || 0 })
  }

  // Authenticated user revalidation
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

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
