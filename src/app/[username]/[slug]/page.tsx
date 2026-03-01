import { getPublicProfile, getPublicPost, getPublicPostTags, getPublicLikeCount, getPublicFollowCounts, supabasePublic } from '@/lib/supabase/public'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { formatDate } from '@/lib/utils'
import { estimateReadTime, renderMarkdown } from '@/lib/markdown'
import ShareButtons from '@/components/ShareButtons'
import LikeButton from '@/components/blog/LikeButton'
import CommentSection from '@/components/blog/CommentSection'
import FollowButton from '@/components/blog/FollowButton'
import InsightsTracker from '@/components/blog/InsightsTracker'

export const revalidate = 3600
export const dynamicParams = true
export async function generateStaticParams() {
  const { supabasePublic } = await import('@/lib/supabase/public')
  const { data: profiles } = await supabasePublic.from('profiles').select('id, username')
  if (!profiles) return []
  const params: { username: string; slug: string }[] = []
  for (const p of profiles) {
    const { data: posts } = await supabasePublic
      .from('articles')
      .select('slug')
      .eq('user_id', p.id)
      .eq('status', 'published')
    if (posts) {
      for (const post of posts) {
        params.push({ username: p.username, slug: post.slug })
      }
    }
  }
  return params
}

type Props = { params: Promise<{ username: string; slug: string }>; searchParams: Promise<{ lang?: string }> }

const langLabels: Record<string, string> = {
  ja: '日本語', en: 'English', zh: '中文(简体)', 'zh-tw': '中文(繁體)',
  ko: '韓国語', es: 'Español', fr: 'Français', de: 'Deutsch', pt: 'Português',
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, slug } = await params
  const profile = await getPublicProfile(decodeURIComponent(username))
  if (!profile) return { title: '記事が見つかりません' }
  const post = await getPublicPost(profile.id, decodeURIComponent(slug))
  if (!post) return { title: '記事が見つかりません' }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nen2.com'
  const ogImageUrl = `${baseUrl}/api/og/${username}/${slug}`

  return {
    title: `${post.title} | ${profile.display_name}`,
    description: post.meta_description || post.excerpt || '',
    openGraph: {
      title: post.title,
      description: post.meta_description || post.excerpt || '',
      type: 'article',
      images: [post.cover_image_url || ogImageUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.meta_description || post.excerpt || '',
    },
  }
}

export default async function PostPage({ params, searchParams }: Props) {
  const { username, slug } = await params
  const { lang } = await searchParams
  const decodedUsername = decodeURIComponent(username)
  const decodedSlug = decodeURIComponent(slug)

  const profile = await getPublicProfile(decodedUsername)
  if (!profile) notFound()

  const post = await getPublicPost(profile.id, decodedSlug)
  if (!post) notFound()

  const [tags, likeCount, followCounts] = await Promise.all([
    getPublicPostTags(post.id),
    getPublicLikeCount(post.id),
    getPublicFollowCounts(profile.id),
  ])

  // Check for translations
  let displayTitle = post.title
  let displayHtml = post.content_html || ''
  let activeLang: string | null = null

  // Get available published translations
  const { data: translations } = await supabasePublic
    .from('nen2_post_translations')
    .select('language_code, title, content, status')
    .eq('post_id', post.id)
    .eq('status', 'published')

  if (lang && translations) {
    const tr = translations.find(t => t.language_code === lang)
    if (tr) {
      displayTitle = tr.title
      displayHtml = renderMarkdown(tr.content)
      activeLang = lang
    }
  }

  const plainText = displayHtml.replace(/<[^>]*>/g, '') || ''
  const readTime = estimateReadTime(plainText)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nen2.com'
  const pageUrl = `${baseUrl}/${username}/${slug}`

  return (
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

      {/* Language switcher */}
      {translations && translations.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1em', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75em', color: '#888' }}>🌐</span>
          <a
            href={`/${username}/${slug}`}
            style={{ fontSize: '0.75em', color: activeLang ? '#666' : '#2563eb', textDecoration: 'none' }}
          >
            原文
          </a>
          {translations.map((tr: any) => (
            <a
              key={tr.language_code}
              href={`/${username}/${slug}?lang=${tr.language_code}`}
              style={{ fontSize: '0.75em', color: activeLang === tr.language_code ? '#2563eb' : '#666', textDecoration: 'none' }}
            >
              {langLabels[tr.language_code] || tr.language_code}
            </a>
          ))}
        </div>
      )}

      <article>
        <h1 className="article__title">{displayTitle}</h1>

        <div className="article__meta">
          {profile.avatar_url ? (
            <Image src={profile.avatar_url} alt="" width={24} height={24} style={{ borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <span
              style={{
                width: 24, height: 24, borderRadius: '50%', display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center',
                background: profile.accent_color, color: '#fff', fontSize: '0.7em', fontWeight: 700,
              }}
            >
              {profile.display_name?.charAt(0)}
            </span>
          )}
          <span>{profile.display_name}</span>
          <span>&middot;</span>
          {post.published_at && <time>{formatDate(post.published_at)}</time>}
          <span>&middot;</span>
          <span>{readTime}分で読める</span>
        </div>

        {tags.length > 0 && (
          <div style={{ marginBottom: '1.5em' }}>
            {tags.map((tag: string) => (
              <Link key={tag} href={`/${username}/tags/${encodeURIComponent(tag)}`} className="tag">
                #{tag}
              </Link>
            ))}
          </div>
        )}

        <div className="article__content" dangerouslySetInnerHTML={{ __html: displayHtml }} />
      </article>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <ShareButtons url={pageUrl} title={post.title} />
        <LikeButton articleId={post.id} initialLikeCount={likeCount} />
      </div>

      {/* Author bio */}
      <div className="author-bio">
        {profile.avatar_url ? (
          <Image src={profile.avatar_url} alt="" width={48} height={48} className="author-bio__avatar" />
        ) : (
          <div
            className="author-bio__avatar"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: profile.accent_color, color: '#fff', fontWeight: 700, fontSize: '1.2em',
            }}
          >
            {profile.display_name?.charAt(0) || '?'}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div className="author-bio__name">{profile.display_name}</div>
          {profile.bio && <p className="author-bio__description">{profile.bio}</p>}
        </div>
        <FollowButton
          userId={profile.id}
          initialFollowerCount={followCounts.follower_count}
          initialFollowingCount={followCounts.following_count}
          showCounts={false}
        />
      </div>

      <CommentSection articleId={post.id} initialComments={[]} />
      <InsightsTracker postId={post.id} authorId={profile.id} />
    </div>
  )
}
