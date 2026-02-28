import { getPublicProfile } from '@/lib/supabase/public'
import { notFound } from 'next/navigation'
import BlogThemeWrapper from '@/components/blog/BlogThemeWrapper'
import Link from 'next/link'
import Image from 'next/image'

export const revalidate = 3600

export default async function UserBlogLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const decodedUsername = decodeURIComponent(username)
  const profile = await getPublicProfile(decodedUsername)
  if (!profile) notFound()

  return (
    <BlogThemeWrapper profile={profile}>
      <header className="header">
        {profile.header_image_url && (
          <Image
            src={profile.header_image_url}
            alt=""
            width={1200}
            height={300}
            sizes="100vw"
            priority
            className="header-image"
          />
        )}
        <div className="header-inner">
          <Link href={`/${username}`} className="logo">
            {profile.display_name}のブログ
          </Link>
        </div>
      </header>

      {children}

      <footer className="footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <Link href={`/${username}`}>トップ</Link>
        <span>·</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          Powered by
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <img src="/logo.png" alt="" style={{ width: '1.9em', height: '1.9em' }} />
            NEN2
          </Link>
        </span>
      </footer>
    </BlogThemeWrapper>
  )
}
