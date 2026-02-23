import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const username = body.username as string | undefined

  if (!username) {
    return NextResponse.json({ error: 'username is required' }, { status: 400 })
  }

  revalidatePath(`/${username}`, 'layout')

  return NextResponse.json({ revalidated: true })
}
