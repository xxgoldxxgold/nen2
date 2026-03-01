import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { NextResponse } from 'next/server'
import type { VersionChangeType } from '@/lib/types'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params
  const supabase = await createClient()
  const db = createDataServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const url = new URL(request.url)
  const limit = parseInt(url.searchParams.get('limit') || '50')
  const offset = parseInt(url.searchParams.get('offset') || '0')

  const { data, error } = await db
    .from('blog_post_versions')
    .select('id, post_id, user_id, version_number, title, change_type, change_summary, word_count, created_at')
    .eq('post_id', postId)
    .order('version_number', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params
  const supabase = await createClient()
  const db = createDataServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  // Verify post ownership
  const { data: post } = await db
    .from('blog_posts')
    .select('user_id')
    .eq('id', postId)
    .single()

  if (!post || post.user_id !== user.id) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 })
  }

  const body = await request.json()
  const {
    title, content, content_html, excerpt, meta_description, tags,
    change_type, change_summary,
  } = body as {
    title: string
    content: string | null
    content_html: string | null
    excerpt: string | null
    meta_description: string | null
    tags: string[] | null
    change_type: VersionChangeType
    change_summary?: string
  }

  // Content hash for deduplication
  const hashSource = `${title}|${content_html || ''}`
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(hashSource))
  const contentHash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  // Skip if same hash exists as the latest version
  const { data: latestVersion } = await db
    .from('blog_post_versions')
    .select('content_hash')
    .eq('post_id', postId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single()

  if (latestVersion?.content_hash === contentHash) {
    return NextResponse.json({ skipped: true, message: '変更なし' })
  }

  // Get next version number
  const { data: maxVersion } = await db
    .from('blog_post_versions')
    .select('version_number')
    .eq('post_id', postId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single()

  const versionNumber = (maxVersion?.version_number || 0) + 1

  // Word count from content_html
  const plainText = (content_html || '').replace(/<[^>]*>/g, '').trim()
  const wordCount = plainText.length > 0 ? plainText.split(/\s+/).length : 0

  const { data: version, error } = await db
    .from('blog_post_versions')
    .insert({
      post_id: postId,
      user_id: user.id,
      version_number: versionNumber,
      title,
      content,
      content_html,
      excerpt: excerpt || null,
      meta_description: meta_description || null,
      tags: tags || null,
      change_type,
      change_summary: change_summary || null,
      content_hash: contentHash,
      word_count: wordCount,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(version, { status: 201 })
}
