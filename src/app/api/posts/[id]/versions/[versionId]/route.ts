import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { NextRequest, NextResponse } from 'next/server'

type RouteContext = { params: Promise<{ id: string; versionId: string }> }

// GET /api/posts/[id]/versions/[versionId] — get version detail
export async function GET(request: NextRequest, context: RouteContext) {
  const { id, versionId } = await context.params
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  // Verify ownership
  const { data: post } = await db.from('articles').select('id').eq('id', id).eq('user_id', user.id).single()
  if (!post) return NextResponse.json({ error: '記事が見つかりません' }, { status: 404 })

  const { data, error } = await db
    .from('nen2_post_versions')
    .select('*')
    .eq('id', versionId)
    .eq('post_id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'バージョンが見つかりません' }, { status: 404 })
  return NextResponse.json(data)
}
