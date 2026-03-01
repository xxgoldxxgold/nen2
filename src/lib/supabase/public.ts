import { createClient } from '@supabase/supabase-js'

// Cookie-free Supabase client for public (unauthenticated) pages.
// Using this instead of the SSR client avoids calling cookies(),
// which allows Next.js to statically generate / ISR these pages.
// Data caching is handled at the page level via `export const revalidate`.
export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_NEN2_DB_URL!,
  process.env.NEXT_PUBLIC_NEN2_DB_ANON_KEY!,
)

export async function getPublicUser(username: string) {
  const { data } = await supabasePublic
    .from('users')
    .select('id, username, display_name, bio, avatar_url, blog_settings')
    .eq('username', username)
    .single()
  return data
}

export async function getPublicPosts(userId: string) {
  const { data } = await supabasePublic
    .from('blog_posts')
    .select('id, title, slug, excerpt, cover_image_url, published_at')
    .eq('user_id', userId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
  return data
}

export async function getPublicPost(userId: string, slug: string) {
  const { data } = await supabasePublic
    .from('blog_posts')
    .select('id, title, slug, excerpt, content_html, cover_image_url, published_at, meta_description')
    .eq('user_id', userId)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  return data
}

export async function getPublicPostTags(postId: string) {
  const { data } = await supabasePublic
    .from('blog_post_tags')
    .select('blog_tags(name)')
    .eq('post_id', postId)
  return data?.map((pt: any) => pt.blog_tags?.name).filter(Boolean) || []
}

export async function getPublicTag(tagName: string) {
  const { data } = await supabasePublic
    .from('blog_tags')
    .select('id')
    .eq('name', tagName)
    .single()
  return data
}

export async function getPublicPostTranslation(postId: string, lang: string) {
  const { data } = await supabasePublic
    .from('blog_post_translations')
    .select('language_code, title, content_html, excerpt, meta_description, status, published_at')
    .eq('post_id', postId)
    .eq('language_code', lang)
    .eq('status', 'published')
    .single()
  return data
}

export async function getPublicPostTranslations(postId: string) {
  const { data } = await supabasePublic
    .from('blog_post_translations')
    .select('language_code, title, status')
    .eq('post_id', postId)
    .eq('status', 'published')
  return data || []
}

export async function getPublicPostsByTag(tagId: string, userId: string) {
  const { data: postTags } = await supabasePublic
    .from('blog_post_tags')
    .select('post_id')
    .eq('tag_id', tagId)

  if (!postTags || postTags.length === 0) return []

  const { data } = await supabasePublic
    .from('blog_posts')
    .select('id, title, slug, excerpt, cover_image_url, published_at')
    .in('id', postTags.map(pt => pt.post_id))
    .eq('user_id', userId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
  return data || []
}
