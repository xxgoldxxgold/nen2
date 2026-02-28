import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { supabasePublic } from '@/lib/supabase/public'

export const runtime = 'edge'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string; slug: string }> }
) {
  const { username, slug } = await params

  // Fetch profile and post
  const { data: profile } = await supabasePublic
    .from('profiles')
    .select('id, display_name, accent_color')
    .eq('username', username)
    .single()

  if (!profile) {
    return new Response('Not found', { status: 404 })
  }

  const { data: post } = await supabasePublic
    .from('articles')
    .select('title, excerpt')
    .eq('user_id', profile.id)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!post) {
    return new Response('Not found', { status: 404 })
  }

  const accentColor = profile.accent_color || '#5c6b4a'

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px',
          background: '#fafafa',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            borderLeft: `6px solid ${accentColor}`,
            paddingLeft: '24px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: '#1a1a1a',
              lineHeight: 1.3,
              marginBottom: 16,
            }}
          >
            {post.title}
          </div>
          {post.excerpt && (
            <div
              style={{
                fontSize: 24,
                color: '#555',
                lineHeight: 1.5,
              }}
            >
              {post.excerpt.slice(0, 100)}
            </div>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 40,
          }}
        >
          <div style={{ fontSize: 20, color: '#888' }}>
            {profile.display_name}
          </div>
          <div style={{ fontSize: 20, color: accentColor, fontWeight: 700 }}>
            NEN2
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
