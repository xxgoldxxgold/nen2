import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const username = body.username as string | undefined

  if (username) {
    // Invalidate the user's blog pages so Next.js refetches data
    revalidatePath(`/${username}`, 'layout')
  }

  return NextResponse.json({ revalidated: true })
}
