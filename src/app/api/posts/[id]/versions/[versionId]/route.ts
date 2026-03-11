import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const { id: postId, versionId } = await params
  const supabase = await createClient()
  const db = createDataServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  // Verify post ownership
  const { data: post } = await db
    .from('blog_posts')
    .select('user_id')
    .eq('id', postId)
    .single()

  if (!post || post.user_id !== user.id) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 })
  }

  const { data, error } = await db
    .from('blog_post_versions')
    .select('*')
    .eq('id', versionId)
    .eq('post_id', postId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'バージョンが見つかりません' }, { status: 404 })
  }

  return NextResponse.json(data)
}
