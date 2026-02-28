import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Sync tags for a post: upsert tag names, then reconcile article_tags.
 */
export async function syncPostTags(
  db: SupabaseClient,
  postId: string,
  tagNames: string[]
): Promise<void> {
  // Normalize & deduplicate
  const names = [...new Set(tagNames.map(n => n.trim()).filter(Boolean))]

  if (names.length === 0) {
    // Remove all tags for this post
    await db.from('article_tags').delete().eq('article_id', postId)
    return
  }

  // Upsert tags (insert if not exists)
  const { data: existingTags } = await db
    .from('tags')
    .select('id, name')
    .in('name', names)

  const existingNames = new Set((existingTags || []).map(t => t.name))
  const newNames = names.filter(n => !existingNames.has(n))

  let allTags = existingTags || []

  if (newNames.length > 0) {
    const { data: inserted } = await db
      .from('tags')
      .insert(newNames.map(name => ({ name })))
      .select('id, name')
    if (inserted) allTags = [...allTags, ...inserted]
  }

  // Build desired article_tags
  const tagIds = allTags
    .filter(t => names.includes(t.name))
    .map(t => t.id)

  // Delete existing article_tags and re-insert
  await db.from('article_tags').delete().eq('article_id', postId)

  if (tagIds.length > 0) {
    await db.from('article_tags').insert(
      tagIds.map(tag_id => ({ article_id: postId, tag_id }))
    )
  }
}
