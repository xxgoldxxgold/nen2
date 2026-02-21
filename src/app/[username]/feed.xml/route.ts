import { getPublicUser, getPublicPosts } from '@/lib/supabase/public'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  const user = await getPublicUser(decodeURIComponent(username))

  if (!user) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const posts = await getPublicPosts(user.id)
  const baseUrl = new URL(request.url).origin

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(user.display_name)}のブログ</title>
    <link>${baseUrl}/${username}</link>
    <description>${escapeXml(user.bio || '')}</description>
    <language>ja</language>
    <atom:link href="${baseUrl}/${username}/feed.xml" rel="self" type="application/rss+xml"/>
    ${(posts || []).map(post => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${baseUrl}/${username}/${post.slug}</link>
      <guid isPermaLink="true">${baseUrl}/${username}/${post.slug}</guid>
      <description>${escapeXml(post.excerpt || '')}</description>
      <pubDate>${new Date(post.published_at!).toUTCString()}</pubDate>
    </item>`).join('')}
  </channel>
</rss>`

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
