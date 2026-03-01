import { getPublicUser, getPublicPost, getPublicPostTags, getPublicPostTranslation, getPublicPostTranslations } from '@/lib/supabase/public'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import BlogThemeWrapper from '@/components/blog/BlogThemeWrapper'
import Avatar from '@/components/blog/Avatar'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ username: string; slug: string }>
  searchParams: Promise<{ lang?: string }>
}

const LANG_LABELS: Record<string, string> = {
  ja: '🇯🇵 日本語',
  en: '🇺🇸 English',
  zh: '🇨🇳 中文（簡体）',
  'zh-tw': '🇹🇼 中文（繁體）',
  ko: '🇰🇷 한국어',
  es: '🇪🇸 Español',
  fr: '🇫🇷 Français',
  de: '🇩🇪 Deutsch',
  pt: '🇧🇷 Português',
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { username, slug } = await params
  const { lang } = await searchParams
  const user = await getPublicUser(decodeURIComponent(username))
  if (!user) return { title: '記事が見つかりません' }
  const post = await getPublicPost(user.id, decodeURIComponent(slug))
  if (!post) return { title: '記事が見つかりません' }

  let title = post.title
  let description = post.meta_description || post.excerpt || ''

  if (lang) {
    const translation = await getPublicPostTranslation(post.id, lang)
    if (translation) {
      title = translation.title
      if (translation.meta_description) description = translation.meta_description
      else if (translation.excerpt) description = translation.excerpt
    }
  }

  return {
    title: `${title} | ${user.display_name}`,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      ...(post.cover_image_url && { images: [post.cover_image_url] }),
    },
    twitter: {
      card: post.cover_image_url ? 'summary_large_image' : 'summary',
      title,
      description,
    },
  }
}

export default async function PostPage({ params, searchParams }: Props) {
  const { username, slug } = await params
  const { lang } = await searchParams
  const decodedUsername = decodeURIComponent(username)
  const decodedSlug = decodeURIComponent(slug)

  const user = await getPublicUser(decodedUsername)
  if (!user) notFound()

  const post = await getPublicPost(user.id, decodedSlug)
  if (!post) notFound()

  const tags = await getPublicPostTags(post.id)
  const availableTranslations = await getPublicPostTranslations(post.id)

  // If lang param specified, fetch translation
  const translation = lang ? await getPublicPostTranslation(post.id, lang) : null
  const displayTitle = translation?.title || post.title
  const displayHtml = translation?.content_html || post.content_html || ''
  const displayExcerpt = translation?.excerpt || post.excerpt

  const readTime = Math.ceil((displayHtml.replace(/<[^>]*>/g, '').length || 0) / 500)

  const langSwitcher = availableTranslations.length > 0 ? (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1em' }}>
      <Link
        href={`/${username}/${slug}`}
        className="tag"
        style={!lang ? { fontWeight: 700, opacity: 1 } : { opacity: 0.6 }}
      >
        🇯🇵 日本語
      </Link>
      {availableTranslations.map((t: any) => (
        <Link
          key={t.language_code}
          href={`/${username}/${slug}?lang=${t.language_code}`}
          className="tag"
          style={lang === t.language_code ? { fontWeight: 700, opacity: 1 } : { opacity: 0.6 }}
        >
          {LANG_LABELS[t.language_code] || t.language_code}
        </Link>
      ))}
    </div>
  ) : null

  const articleContent = (
    <article>
      <h1 className="article__title">{displayTitle}</h1>

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

      {langSwitcher}

      {tags.length > 0 && (
        <div style={{ marginBottom: '1.5em' }}>
          {tags.map((tag: string) => (
            <Link key={tag} href={`/${username}/tag/${encodeURIComponent(tag)}`} className="tag">
              #{tag}
            </Link>
          ))}
        </div>
      )}

      <div className="article__content" dangerouslySetInnerHTML={{ __html: displayHtml }} />
    </article>
  )

  return (
    <BlogThemeWrapper blogSettings={user.blog_settings || {}} analyticsUserId={user.id} analyticsPostId={post.id}>
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

        {articleContent}
        <div className="author-bio">
          <Avatar src={user.avatar_url} name={user.display_name} size={48} className="author-bio__avatar" />
          <div>
            <div className="author-bio__name">{user.display_name}</div>
            {user.bio && <p className="author-bio__description">{user.bio}</p>}
          </div>
        </div>
      </div>

      <footer className="footer">
        <Link href={`/${username}`}>他の記事を読む</Link> &middot; Powered by <Link href="/"><Image src="/logo.png" alt="NEN2" width={16} height={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> NEN2</Link>
      </footer>
    </BlogThemeWrapper>
  )
}
