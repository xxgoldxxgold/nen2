import { supabasePublic } from '@/lib/supabase/public'
import { MetadataRoute } from 'next'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nen2.com'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/signup`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]

  // User blogs
  const { data: users } = await supabasePublic
    .from('users')
    .select('username, updated_at')
    .limit(1000)

  const userPages: MetadataRoute.Sitemap = (users || []).map(user => ({
    url: `${baseUrl}/${user.username}`,
    lastModified: new Date(user.updated_at),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))

  // Published posts
  const { data: posts } = await supabasePublic
    .from('blog_posts')
    .select('slug, user_id, updated_at, users(username)')
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
    .limit(5000)

  const postPages: MetadataRoute.Sitemap = (posts || []).map((post: any) => ({
    url: `${baseUrl}/${post.users?.username}/${post.slug}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...userPages, ...postPages]
}
