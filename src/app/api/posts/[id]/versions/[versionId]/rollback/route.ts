import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { NextResponse } from 'next/server'

export async function POST(
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

  // Get the version to rollback to
  const { data: version } = await db
    .from('blog_post_versions')
    .select('*')
    .eq('id', versionId)
    .eq('post_id', postId)
    .single()

  if (!version) {
    return NextResponse.json({ error: 'バージョンが見つかりません' }, { status: 404 })
  }

  // Update blog_posts with version data
  const { error: updateError } = await db
    .from('blog_posts')
    .update({
      title: version.title,
      content: version.content,
      content_html: version.content_html,
      excerpt: version.excerpt,
      meta_description: version.meta_description,
    })
    .eq('id', postId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Update tags if version has them
  if (version.tags && version.tags.length > 0) {
    await db.from('blog_post_tags').delete().eq('post_id', postId)
    for (const tagName of version.tags) {
      const { data: existingTag } = await db
        .from('blog_tags')
        .select('id')
        .eq('name', tagName)
        .single()

      let tagId: string
      if (existingTag) {
        tagId = existingTag.id
      } else {
        const { data: newTag } = await db
          .from('blog_tags')
          .insert({ name: tagName })
          .select('id')
          .single()
        tagId = newTag!.id
      }
      await db.from('blog_post_tags').insert({ post_id: postId, tag_id: tagId })
    }
  }

  // Create a new version recording the rollback
  const { data: maxVersion } = await db
    .from('blog_post_versions')
    .select('version_number')
    .eq('post_id', postId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single()

  const newVersionNumber = (maxVersion?.version_number || 0) + 1

  const hashSource = `${version.title}|${version.content_html || ''}`
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(hashSource))
  const contentHash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  await db.from('blog_post_versions').insert({
    post_id: postId,
    user_id: user.id,
    version_number: newVersionNumber,
    title: version.title,
    content: version.content,
    content_html: version.content_html,
    excerpt: version.excerpt,
    meta_description: version.meta_description,
    tags: version.tags,
    change_type: 'rollback',
    change_summary: `v${version.version_number}からロールバック`,
    content_hash: contentHash,
    word_count: version.word_count,
  })

  // Return updated post data
  const { data: updatedPost } = await db
    .from('blog_posts')
    .select('*')
    .eq('id', postId)
    .single()

  return NextResponse.json(updatedPost)
}
