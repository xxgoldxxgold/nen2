import { getPublicUser, getPublicPosts } from '@/lib/supabase/public'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import BlogThemeWrapper from '@/components/blog/BlogThemeWrapper'
import Avatar from '@/components/blog/Avatar'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const user = await getPublicUser(decodeURIComponent(username))
  if (!user) return { title: 'ブログが見つかりません' }
  return {
    title: `${user.display_name}のブログ`,
    description: user.bio || `${user.display_name}のブログです`,
  }
}

export default async function UserBlogPage({ params }: Props) {
  const { username } = await params
  const decodedUsername = decodeURIComponent(username)
  const user = await getPublicUser(decodedUsername)
  if (!user) notFound()

  const posts = await getPublicPosts(user.id)

  const articleList = posts && posts.length > 0 ? (
    <div className="article-list">
      {posts.map((post) => (
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
            <div className="article-card__meta">
              {post.published_at && (
                <time>{new Date(post.published_at).toLocaleDateString('ja-JP')}</time>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  ) : (
    <p style={{ textAlign: 'center', color: 'var(--c-text-m)', padding: '4em 0' }}>
      まだ記事が公開されていません
    </p>
  )

  return (
    <BlogThemeWrapper blogSettings={user.blog_settings || {}} analyticsUserId={user.id}>
      {(user.blog_settings as any)?.images?.header_image_url ? (
        <div className="blog-header-image" style={{ position: 'relative' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={(user.blog_settings as any).images.header_image_url}
            alt={`${user.display_name}のブログ`}
            style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '400px', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.45) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Link
              href={`/${username}`}
              className="logo"
              style={{ color: '#fff', fontSize: '2em', textDecoration: 'none', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
            >
              {user.display_name}のブログ
            </Link>
          </div>
          {(user.blog_settings as any)?.images?.header_photo_credit && (
            <div style={{
              position: 'absolute',
              bottom: 4,
              right: 12,
              fontSize: '11px',
              color: 'rgba(255,255,255,0.7)',
            }}>
              Photo by{' '}
              <a
                href={(user.blog_settings as any).images.header_photo_credit.pexels_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'inherit' }}
              >
                {(user.blog_settings as any).images.header_photo_credit.photographer}
              </a>
              {' '}on{' '}
              <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                Pexels
              </a>
            </div>
          )}
        </div>
      ) : (
        <header className="header">
          <div className="header-inner">
            <Link href={`/${username}`} className="logo">{user.display_name}のブログ</Link>
          </div>
        </header>
      )}

      <div className="container" style={{ paddingTop: '2em', paddingBottom: '2em' }}>
        <div className="author-bio" style={{ borderTop: 'none', marginTop: 0, paddingTop: 0, marginBottom: '2em' }}>
          <Avatar src={user.avatar_url} name={user.display_name} size={48} className="author-bio__avatar" />
          <div>
            <div className="author-bio__name">{user.display_name}</div>
            {user.bio && <p className="author-bio__description">{user.bio}</p>}
          </div>
        </div>
        {articleList}
      </div>

      <footer className="footer">
        Powered by <Link href="/"><Image src="/logo.png" alt="NEN2" width={16} height={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> NEN2</Link>
      </footer>
    </BlogThemeWrapper>
  )
}
