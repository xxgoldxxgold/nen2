import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { generateInlineCSS, generateFontPreloads, migrateOldSettings } from '@/lib/theme'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { settings } = await request.json()
  if (!settings || typeof settings !== 'object') {
    return NextResponse.json({ error: '設定データが必要です' }, { status: 400 })
  }

  try {
    const db = createDataServer()

    // Ensure settings are properly migrated and include generated CSS
    const migrated = migrateOldSettings(settings)
    const toSave = {
      ...migrated,
      css: { inline: generateInlineCSS(migrated) },
      font_preload: generateFontPreloads(migrated),
    }

    const { error } = await db
      .from('users')
      .update({ blog_settings: toSave })
      .eq('id', user.id)

    if (error) {
      console.error('Save blog settings DB error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Revalidate public blog page
    const { data: userInfo } = await db.from('users').select('username').eq('id', user.id).single()
    if (userInfo?.username) {
      revalidatePath(`/${userInfo.username}`, 'layout')
    }

    return NextResponse.json({ ok: true, settings: toSave })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Save blog settings error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
