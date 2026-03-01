import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

type RouteContext = { params: Promise<{ id: string }> }

// GET /api/posts/[id]/versions — list versions
export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  // Verify ownership
  const { data: post } = await db.from('articles').select('id').eq('id', id).eq('user_id', user.id).single()
  if (!post) return NextResponse.json({ error: '記事が見つかりません' }, { status: 404 })

  const { data, error } = await db
    .from('nen2_post_versions')
    .select('id, version_number, title, change_type, change_summary, word_count, created_at')
    .eq('post_id', id)
    .order('version_number', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/posts/[id]/versions — create version manually
export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { data: post } = await db.from('articles').select('*').eq('id', id).eq('user_id', user.id).single()
  if (!post) return NextResponse.json({ error: '記事が見つかりません' }, { status: 404 })

  const body = await request.json()
  const changeType = body.change_type || 'manual_save'
  const changeSummary = body.change_summary || null

  const content = post.content || ''
  const contentHash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 16)

  // Check for duplicate
  const { data: existing } = await db
    .from('nen2_post_versions')
    .select('id')
    .eq('post_id', id)
    .eq('content_hash', contentHash)
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json({ message: '変更なし（同じ内容のバージョンが既に存在します）', duplicate: true })
  }

  // Get next version number
  const { data: latest } = await db
    .from('nen2_post_versions')
    .select('version_number')
    .eq('post_id', id)
    .order('version_number', { ascending: false })
    .limit(1)

  const versionNumber = (latest?.[0]?.version_number || 0) + 1
  const wordCount = content.replace(/\s+/g, '').length

  const { data, error } = await db
    .from('nen2_post_versions')
    .insert({
      post_id: id,
      version_number: versionNumber,
      title: post.title,
      content,
      meta_description: post.meta_description,
      change_type: changeType,
      change_summary: changeSummary,
      content_hash: contentHash,
      word_count: wordCount,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
