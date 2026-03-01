import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { renderMarkdown, extractExcerpt } from '@/lib/markdown'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

type RouteContext = { params: Promise<{ id: string; versionId: string }> }

// POST /api/posts/[id]/versions/[versionId]/rollback
export async function POST(request: NextRequest, context: RouteContext) {
  const { id, versionId } = await context.params
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  // Verify ownership
  const { data: post } = await db.from('articles').select('*').eq('id', id).eq('user_id', user.id).single()
  if (!post) return NextResponse.json({ error: '記事が見つかりません' }, { status: 404 })

  // Get target version
  const { data: version } = await db
    .from('nen2_post_versions')
    .select('*')
    .eq('id', versionId)
    .eq('post_id', id)
    .single()

  if (!version) return NextResponse.json({ error: 'バージョンが見つかりません' }, { status: 404 })

  // Save current state as a version before rollback
  const currentHash = crypto.createHash('sha256').update(post.content || '').digest('hex').slice(0, 16)
  const { data: latestV } = await db
    .from('nen2_post_versions')
    .select('version_number')
    .eq('post_id', id)
    .order('version_number', { ascending: false })
    .limit(1)

  const nextVer = (latestV?.[0]?.version_number || 0) + 1

  // Save pre-rollback version
  await db.from('nen2_post_versions').insert({
    post_id: id,
    version_number: nextVer,
    title: post.title,
    content: post.content || '',
    meta_description: post.meta_description,
    change_type: 'rollback',
    change_summary: `v${version.version_number}にロールバック前の状態`,
    content_hash: currentHash,
    word_count: (post.content || '').replace(/\s+/g, '').length,
  })

  // Rollback article to version content
  const content_html = renderMarkdown(version.content)
  const excerpt = extractExcerpt(version.content)

  const { data: updated, error } = await db
    .from('articles')
    .update({
      title: version.title,
      content: version.content,
      content_html,
      excerpt,
      meta_description: version.meta_description,
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ...updated, rolled_back_to: version.version_number })
}
