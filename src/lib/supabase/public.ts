import { createClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'

// Cookie-free Supabase client for public (unauthenticated) pages.
// Using this instead of the SSR client avoids calling cookies(),
// which allows Next.js to statically generate / ISR these pages.
export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_NEN2_DB_URL!,
  process.env.NEXT_PUBLIC_NEN2_DB_ANON_KEY!,
)

// Cached query helpers for ISR
export const getPublicUser = unstable_cache(
  async (username: string) => {
    const { data } = await supabasePublic
      .from('users')
      .select('id, username, display_name, bio, avatar_url, blog_settings')
      .eq('username', username)
      .single()
    return data
  },
  ['public-user'],
  { revalidate: 300 }
)

export const getPublicPosts = unstable_cache(
  async (userId: string) => {
    const { data } = await supabasePublic
      .from('blog_posts')
      .select('id, title, slug, excerpt, cover_image_url, published_at')
      .eq('user_id', userId)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
    return data
  },
  ['public-posts'],
  { revalidate: 300 }
)

export const getPublicPost = unstable_cache(
  async (userId: string, slug: string) => {
    const { data } = await supabasePublic
      .from('blog_posts')
      .select('id, title, slug, excerpt, content_html, cover_image_url, published_at, meta_description')
      .eq('user_id', userId)
      .eq('slug', slug)
      .eq('status', 'published')
      .single()
    return data
  },
  ['public-post'],
  { revalidate: 300 }
)

export const getPublicPostTags = unstable_cache(
  async (postId: string) => {
    const { data } = await supabasePublic
      .from('blog_post_tags')
      .select('blog_tags(name)')
      .eq('post_id', postId)
    return data?.map((pt: any) => pt.blog_tags?.name).filter(Boolean) || []
  },
  ['public-post-tags'],
  { revalidate: 300 }
)

export const getPublicTag = unstable_cache(
  async (tagName: string) => {
    const { data } = await supabasePublic
      .from('blog_tags')
      .select('id')
      .eq('name', tagName)
      .single()
    return data
  },
  ['public-tag'],
  { revalidate: 300 }
)

export const getPublicPostsByTag = unstable_cache(
  async (tagId: string, userId: string) => {
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
  },
  ['public-posts-by-tag'],
  { revalidate: 300 }
)
