import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { NextRequest, NextResponse } from 'next/server'

type RouteContext = { params: Promise<{ id: string }> }

// GET /api/posts/[id]/translations — list translations
export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  // Verify ownership
  const { data: post } = await db.from('articles').select('id').eq('id', id).eq('user_id', user.id).single()
  if (!post) return NextResponse.json({ error: '記事が見つかりません' }, { status: 404 })

  const { data, error } = await db
    .from('nen2_post_translations')
    .select('id, language_code, title, status, created_at, updated_at')
    .eq('post_id', id)
    .order('language_code')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
