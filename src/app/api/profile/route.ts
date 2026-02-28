import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { validateUsername } from '@/lib/reserved-usernames'
import { sanitizeHexColor, sanitizeFontName, DEFAULT_THEME } from '@/lib/theme'
import { NextResponse } from 'next/server'

// GET /api/profile — get current user's profile (with auto-provision)
export async function GET() {
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  let { data: profile } = await db.from('profiles').select('*').eq('id', user.id).single()

  if (!profile) {
    let username = user.user_metadata?.username || user.email?.split('@')[0]?.replace(/[^a-z0-9_-]/gi, '').toLowerCase() || ''
    // Enforce minimum length and reserved word check on auto-provision
    if (validateUsername(username) !== null) {
      username = 'user-' + user.id.slice(0, 8)
    }
    const { data: created } = await db.from('profiles').insert({
      id: user.id,
      email: user.email,
      username,
      display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
    }).select().single()
    profile = created
  }

  return NextResponse.json(profile)
}

// PUT /api/profile — update current user's profile
export async function PUT(request: Request) {
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const body = await request.json()
  const { display_name, username, bio, avatar_url, accent_color, heading_font, body_font, header_image_url } = body

  // Server-side username validation
  if (username !== undefined) {
    if (typeof username !== 'string' || !/^[a-z0-9_-]+$/.test(username)) {
      return NextResponse.json({ error: 'ユーザー名は半角英小文字・数字・ハイフン・アンダースコアのみ使用できます' }, { status: 400 })
    }
    const validationError = validateUsername(username)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }
  }

  // Sanitize design fields
  const updateData: Record<string, unknown> = {}
  if (display_name !== undefined) updateData.display_name = String(display_name).slice(0, 100)
  if (username !== undefined) updateData.username = username
  if (bio !== undefined) updateData.bio = String(bio).slice(0, 500)
  if (avatar_url !== undefined) updateData.avatar_url = avatar_url || null
  if (accent_color !== undefined) updateData.accent_color = sanitizeHexColor(accent_color)
  if (heading_font !== undefined) updateData.heading_font = sanitizeFontName(heading_font, DEFAULT_THEME.heading_font)
  if (body_font !== undefined) updateData.body_font = sanitizeFontName(body_font, DEFAULT_THEME.body_font)
  if (header_image_url !== undefined) updateData.header_image_url = header_image_url || null

  const { data, error } = await db
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    if (error.message.includes('unique') || error.message.includes('duplicate')) {
      return NextResponse.json({ error: 'このユーザー名は既に使用されています' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
