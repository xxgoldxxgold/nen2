import { createClient } from '@supabase/supabase-js'

// Cookie-free Supabase client for public (unauthenticated) pages.
// Using this instead of the SSR client avoids calling cookies(),
// which allows Next.js to statically generate / ISR these pages.
export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_NEN2_DB_URL!,
  process.env.NEXT_PUBLIC_NEN2_DB_ANON_KEY!,
)

// Direct query helpers — ISR revalidation is handled by page-level `export const revalidate`
export async function getPublicProfile(username: string) {
  const { data } = await supabasePublic
    .from('profiles')
    .select('id, username, display_name, bio, avatar_url, accent_color, heading_font, body_font, header_image_url')
    .eq('username', username)
    .single()
  return data
}

export async function getPublicPosts(userId: string) {
  const { data } = await supabasePublic
    .from('articles')
    .select('id, title, slug, excerpt, cover_image_url, published_at')
    .eq('user_id', userId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
  return data
}

export async function getPublicPost(userId: string, slug: string) {
  const { data } = await supabasePublic
    .from('articles')
    .select('id, title, slug, excerpt, content_html, cover_image_url, published_at, meta_description')
    .eq('user_id', userId)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  return data
}

export async function getPublicPostTags(postId: string) {
  const { data } = await supabasePublic
    .from('article_tags')
    .select('tags(name)')
    .eq('article_id', postId)
  return data?.map((pt: any) => pt.tags?.name).filter(Boolean) || []
}

export async function getPublicTag(tagName: string) {
  const { data } = await supabasePublic
    .from('tags')
    .select('id')
    .eq('name', tagName)
    .single()
  return data
}

export async function getPublicPostsByTag(tagId: string, userId: string) {
  const { data: postTags } = await supabasePublic
    .from('article_tags')
    .select('article_id')
    .eq('tag_id', tagId)

  if (!postTags || postTags.length === 0) return []

  const { data } = await supabasePublic
    .from('articles')
    .select('id, title, slug, excerpt, cover_image_url, published_at')
    .in('id', postTags.map(pt => pt.article_id))
    .eq('user_id', userId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
  return data || []
}

// --- Social public queries (for ISR initial data) ---

export async function getPublicFollowCounts(userId: string) {
  const [{ count: followerCount }, { count: followingCount }] = await Promise.all([
    supabasePublic.from('nen2_follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
    supabasePublic.from('nen2_follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
  ])
  return { follower_count: followerCount || 0, following_count: followingCount || 0 }
}

export async function getPublicLikeCount(articleId: string) {
  const { count } = await supabasePublic
    .from('nen2_likes')
    .select('*', { count: 'exact', head: true })
    .eq('article_id', articleId)
  return count || 0
}

export async function getPublicComments(articleId: string) {
  const { data: comments } = await supabasePublic
    .from('nen2_comments')
    .select('id, user_id, article_id, body, created_at, updated_at')
    .eq('article_id', articleId)
    .order('created_at', { ascending: true })
  if (!comments || comments.length === 0) return []

  // Join with profiles for author info
  const userIds = [...new Set(comments.map(c => c.user_id))]
  const { data: profiles } = await supabasePublic
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', userIds)
  const profileMap = new Map((profiles || []).map(p => [p.id, p]))

  return comments.map(c => {
    const p = profileMap.get(c.user_id)
    return {
      ...c,
      author_name: p?.display_name || '名無し',
      author_avatar_url: p?.avatar_url || null,
    }
  })
}
