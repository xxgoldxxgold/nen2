import { getPublicUser, getPublicTag, getPublicPostsByTag } from '@/lib/supabase/public'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import BlogThemeWrapper, { getThemeLayout } from '@/components/blog/BlogThemeWrapper'
import Avatar from '@/components/blog/Avatar'

export const revalidate = 60
export const dynamicParams = true
export async function generateStaticParams() { return [] }

type Props = { params: Promise<{ username: string; name: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, name } = await params
  return { title: `#${decodeURIComponent(name)} | ${username}のブログ` }
}

export default async function TagPage({ params }: Props) {
  const { username, name } = await params
  const tagName = decodeURIComponent(name)
  const decodedUsername = decodeURIComponent(username)

  const user = await getPublicUser(decodedUsername)
  if (!user) notFound()

  const tag = await getPublicTag(tagName)
  const posts = tag ? await getPublicPostsByTag(tag.id, user.id) : []

  const layout = getThemeLayout(user.blog_settings || {})
  const isTwoCol = layout.type === 'two_column'

  const articleList = (
    <>
      <h1 style={{ marginBottom: '0.3em' }}>#{tagName}</h1>
      <p style={{ color: 'var(--c-text-m)', fontSize: 'var(--fs-sm)', marginBottom: '2em' }}>
        {posts.length}件の記事
      </p>

      {posts.length > 0 ? (
        <div className="article-list">
          {posts.map((post: any) => (
            <Link key={post.id} href={`/${username}/${post.slug}`} className="article-card">
              {post.cover_image_url && (
                <div className="article-card__thumbnail">
                  <Image
                    src={post.cover_image_url}
                    alt={post.title}
                    width={600}
                    height={400}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}
              <div className="article-card__body">
                <h2 className="article-card__title">{post.title}</h2>
                {post.excerpt && <p className="article-card__excerpt">{post.excerpt}</p>}
                {post.published_at && (
                  <div className="article-card__meta">
                    <time>{new Date(post.published_at).toLocaleDateString('ja-JP')}</time>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p style={{ textAlign: 'center', color: 'var(--c-text-m)', padding: '4em 0' }}>
          このタグの記事はまだありません
        </p>
      )}
    </>
  )

  const sidebar = (
    <aside className="two-col__side">
      <div className="sidebar-section">
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Avatar src={user.avatar_url} name={user.display_name} size={48} />
          <div>
            <div style={{ fontWeight: 700 }}>{user.display_name}</div>
            {user.bio && <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--c-text2)', margin: '0.3em 0 0' }}>{user.bio}</p>}
          </div>
        </div>
      </div>
    </aside>
  )

  return (
    <BlogThemeWrapper blogSettings={user.blog_settings || {}}>
      <header className="header">
        <div className="header-inner">
          <Link href={`/${username}`} className="logo" style={{ fontSize: '1em' }}>
            &larr; {user.display_name}のブログ
          </Link>
        </div>
      </header>

      <div className="container" style={{ paddingTop: '2em', paddingBottom: '2em' }}>
        {isTwoCol ? (
          <div className="two-col">
            <div className="two-col__main">{articleList}</div>
            {sidebar}
          </div>
        ) : (
          articleList
        )}
      </div>
    </BlogThemeWrapper>
  )
}
