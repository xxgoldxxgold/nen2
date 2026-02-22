import { getPublicUser, getPublicPost, getPublicPostTags } from '@/lib/supabase/public'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import BlogThemeWrapper, { getThemeLayout } from '@/components/blog/BlogThemeWrapper'
import Avatar from '@/components/blog/Avatar'

export const revalidate = 60
export const dynamicParams = true
export async function generateStaticParams() { return [] }

type Props = { params: Promise<{ username: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, slug } = await params
  const user = await getPublicUser(decodeURIComponent(username))
  if (!user) return { title: '記事が見つかりません' }
  const post = await getPublicPost(user.id, decodeURIComponent(slug))
  if (!post) return { title: '記事が見つかりません' }
  return {
    title: `${post.title} | ${user.display_name}`,
    description: post.meta_description || post.excerpt || '',
    openGraph: {
      title: post.title,
      description: post.meta_description || post.excerpt || '',
      type: 'article',
      ...(post.cover_image_url && { images: [post.cover_image_url] }),
    },
    twitter: {
      card: post.cover_image_url ? 'summary_large_image' : 'summary',
      title: post.title,
      description: post.meta_description || post.excerpt || '',
    },
  }
}

export default async function PostPage({ params }: Props) {
  const { username, slug } = await params
  const decodedUsername = decodeURIComponent(username)
  const decodedSlug = decodeURIComponent(slug)

  const user = await getPublicUser(decodedUsername)
  if (!user) notFound()

  const post = await getPublicPost(user.id, decodedSlug)
  if (!post) notFound()

  const tags = await getPublicPostTags(post.id)

  const readTime = Math.ceil((post.content_html?.replace(/<[^>]*>/g, '').length || 0) / 500)
  const layout = getThemeLayout(user.blog_settings || {})
  const isTwoCol = layout.type === 'two_column'

  const articleContent = (
    <article>
      <h1 className="article__title">{post.title}</h1>

      <div className="article__meta">
        <Avatar src={user.avatar_url} name={user.display_name} size={24} style={{ display: 'inline-block' }} />
        <span>{user.display_name}</span>
        <span>&middot;</span>
        {post.published_at && (
          <time>{new Date(post.published_at).toLocaleDateString('ja-JP', {
            year: 'numeric', month: 'long', day: 'numeric',
          })}</time>
        )}
        <span>&middot;</span>
        <span>{readTime}分で読める</span>
      </div>

      {tags.length > 0 && (
        <div style={{ marginBottom: '1.5em' }}>
          {tags.map((tag: string) => (
            <Link key={tag} href={`/${username}/tag/${encodeURIComponent(tag)}`} className="tag">
              #{tag}
            </Link>
          ))}
        </div>
      )}

      <div className="article__content" dangerouslySetInnerHTML={{ __html: post.content_html || '' }} />
    </article>
  )

  const sidebar = (
    <aside className="two-col__side">
      <div className="sidebar-section">
        <h3>著者</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Avatar src={user.avatar_url} name={user.display_name} size={40} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 'var(--fs-sm)' }}>{user.display_name}</div>
            {user.bio && <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--c-text2)', margin: '0.2em 0 0' }}>{user.bio}</p>}
          </div>
        </div>
      </div>
      {tags.length > 0 && (
        <div className="sidebar-section">
          <h3>タグ</h3>
          <div>
            {tags.map((tag: string) => (
              <Link key={tag} href={`/${username}/tag/${encodeURIComponent(tag)}`} className="tag" style={{ marginBottom: '0.3em' }}>
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      )}
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
        {post.cover_image_url && (
          <div className="cover">
            <Image
              src={post.cover_image_url}
              alt={post.title}
              width={1200}
              height={630}
              sizes="(max-width: 1200px) 100vw, 1200px"
              priority
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
        )}

        {isTwoCol ? (
          <div className="two-col">
            <div className="two-col__main">
              {articleContent}
            </div>
            {sidebar}
          </div>
        ) : (
          <>
            {articleContent}
            <div className="author-bio">
              <Avatar src={user.avatar_url} name={user.display_name} size={48} className="author-bio__avatar" />
              <div>
                <div className="author-bio__name">{user.display_name}</div>
                {user.bio && <p className="author-bio__description">{user.bio}</p>}
              </div>
            </div>
          </>
        )}
      </div>

      <footer className="footer">
        <Link href={`/${username}`}>他の記事を読む</Link> &middot; Powered by <Link href="/"><Image src="/logo.png" alt="NEN2" width={16} height={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> NEN2</Link>
      </footer>
    </BlogThemeWrapper>
  )
}
