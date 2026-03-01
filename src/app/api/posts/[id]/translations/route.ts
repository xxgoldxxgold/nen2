import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const db = createDataServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { id: postId } = await params

  const { data: post } = await db
    .from('blog_posts')
    .select('id, user_id')
    .eq('id', postId)
    .single()

  if (!post || post.user_id !== user.id) {
    return NextResponse.json({ error: '記事が見つかりません' }, { status: 404 })
  }

  const { data: translations } = await db
    .from('blog_post_translations')
    .select('id, language_code, title, status, translated_from_version, published_at, created_at, updated_at')
    .eq('post_id', postId)
    .order('language_code')

  return NextResponse.json({ translations: translations || [] })
}
