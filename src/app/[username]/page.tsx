import { getPublicProfile, getPublicPosts, getPublicFollowCounts } from '@/lib/supabase/public'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { formatDate } from '@/lib/utils'
import FollowButton from '@/components/blog/FollowButton'

export const revalidate = 3600
export const dynamicParams = true
export async function generateStaticParams() {
  const { supabasePublic } = await import('@/lib/supabase/public')
  const { data } = await supabasePublic.from('profiles').select('username')
  return (data || []).map((p) => ({ username: p.username }))
}

type Props = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const profile = await getPublicProfile(decodeURIComponent(username))
  if (!profile) return { title: 'ブログが見つかりません' }
  return {
    title: `${profile.display_name}のブログ`,
    description: profile.bio || `${profile.display_name}のブログです`,
  }
}

export default async function UserBlogPage({ params }: Props) {
  const { username } = await params
  const decodedUsername = decodeURIComponent(username)
  const profile = await getPublicProfile(decodedUsername)
  if (!profile) notFound()

  const [posts, followCounts] = await Promise.all([
    getPublicPosts(profile.id),
    getPublicFollowCounts(profile.id),
  ])

  return (
    <div className="container" style={{ paddingTop: '2em', paddingBottom: '2em' }}>
      {/* Author info */}
      <div className="author-bio" style={{ borderTop: 'none', marginTop: 0, paddingTop: 0, marginBottom: '1em' }}>
        {profile.avatar_url ? (
          <Image src={profile.avatar_url} alt="" width={48} height={48} className="author-bio__avatar" />
        ) : (
          <div
            className="author-bio__avatar"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: profile.accent_color || '#5c6b4a', color: '#fff', fontWeight: 700, fontSize: '1.2em',
            }}
          >
            {profile.display_name?.charAt(0) || '?'}
          </div>
        )}
        <div>
          <div className="author-bio__name">{profile.display_name}</div>
          {profile.bio && <p className="author-bio__description">{profile.bio}</p>}
        </div>
      </div>

      {/* Follow section */}
      <div style={{ marginBottom: '2em' }}>
        <FollowButton
          userId={profile.id}
          initialFollowerCount={followCounts.follower_count}
          initialFollowingCount={followCounts.following_count}
        />
      </div>

      {/* Post list */}
      {posts && posts.length > 0 ? (
        <div className="article-list">
          {posts.map((post) => (
            <Link key={post.id} href={`/${username}/${post.slug}`} className="article-card">
              {post.cover_image_url && (
                <Image
                  src={post.cover_image_url}
                  alt=""
                  width={800}
                  height={200}
                  sizes="(max-width: 768px) 100vw, 720px"
                  style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8, marginBottom: '0.75em' }}
                />
              )}
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
          まだ記事が公開されていません
        </p>
      )}
    </div>
  )
}
