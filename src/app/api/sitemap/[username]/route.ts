import { NextRequest, NextResponse } from 'next/server'
import { supabasePublic } from '@/lib/supabase/public'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params

  const { data: profile } = await supabasePublic
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single()

  if (!profile) {
    return new NextResponse('Not found', { status: 404 })
  }

  const { data: posts } = await supabasePublic
    .from('articles')
    .select('slug, updated_at, published_at')
    .eq('user_id', profile.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nen2.com'

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/${username}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${(posts || []).map(post => `
  <url>
    <loc>${baseUrl}/${username}/${post.slug}</loc>
    <lastmod>${post.updated_at || post.published_at}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
