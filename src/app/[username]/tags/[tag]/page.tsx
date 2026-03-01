import { getPublicProfile, getPublicTag, getPublicPostsByTag } from '@/lib/supabase/public'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { formatDate } from '@/lib/utils'

export const revalidate = 7200
export const dynamicParams = true
export async function generateStaticParams() {
  const { supabasePublic } = await import('@/lib/supabase/public')
  const { data: profiles } = await supabasePublic.from('profiles').select('id, username')
  if (!profiles) return []
  const params: { username: string; tag: string }[] = []
  for (const p of profiles) {
    const { data: articleTags } = await supabasePublic
      .from('article_tags')
      .select('tags(name), articles!inner(user_id, status)')
      .eq('articles.user_id', p.id)
      .eq('articles.status', 'published')
    if (articleTags) {
      const uniqueTags = new Set(articleTags.map((at: any) => at.tags?.name).filter(Boolean))
      for (const tag of uniqueTags) {
        params.push({ username: p.username, tag: tag as string })
      }
    }
  }
  return params
}

type Props = { params: Promise<{ username: string; tag: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, tag } = await params
  const decodedTag = decodeURIComponent(tag)
  const profile = await getPublicProfile(decodeURIComponent(username))
  if (!profile) return { title: 'ブログが見つかりません' }
  return {
    title: `#${decodedTag} | ${profile.display_name}のブログ`,
    description: `「${decodedTag}」タグの記事一覧`,
  }
}

export default async function TagPage({ params }: Props) {
  const { username, tag } = await params
  const decodedUsername = decodeURIComponent(username)
  const decodedTag = decodeURIComponent(tag)

  const profile = await getPublicProfile(decodedUsername)
  if (!profile) notFound()

  const tagData = await getPublicTag(decodedTag)
  if (!tagData) notFound()

  const posts = await getPublicPostsByTag(tagData.id, profile.id)

  return (
    <div className="container" style={{ paddingTop: '2em', paddingBottom: '2em' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5em' }}>
        <span className="tag" style={{ fontSize: '1rem', marginRight: '0.5em' }}>#{decodedTag}</span>
        の記事 ({posts.length}件)
      </h1>

      {posts.length > 0 ? (
        <div className="article-list">
          {posts.map((post) => (
            <Link key={post.id} href={`/${username}/${post.slug}`} className="article-card">
              <h2 className="article-card__title">{post.title}</h2>
              {post.excerpt && <p className="article-card__excerpt">{post.excerpt}</p>}
              <div className="article-card__meta">
                {post.published_at && <time>{formatDate(post.published_at)}</time>}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p style={{ textAlign: 'center', color: 'var(--c-text-m)', padding: '4em 0' }}>
          このタグの記事はまだありません
        </p>
      )}

      <div style={{ marginTop: '2em' }}>
        <Link href={`/${username}`} style={{ fontSize: '0.875rem' }}>
          &larr; ブログトップに戻る
        </Link>
      </div>
    </div>
  )
}
