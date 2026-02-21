import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { callClaude, checkRateLimit, logAIUsage } from '@/lib/ai'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const allowed = await checkRateLimit(db, user.id, 'suggest')
  if (!allowed) return NextResponse.json({ error: 'AI利用回数の上限に達しました' }, { status: 429 })

  const { context, title } = await request.json()

  try {
    const result = await callClaude(
      'あなたはブログ記事の執筆アシスタントです。記事の続きとして自然な文章を1〜3文程度提案してください。提案文のみを出力してください。',
      `記事タイトル: ${title || '不明'}\n直前の文脈: ${context}\n\n続きの文章を提案してください。`,
      256
    )

    await logAIUsage(db, user.id, 'suggest')
    return NextResponse.json({ suggestion: result })
  } catch (error) {
    console.error('AI suggest error:', error)
    return NextResponse.json({ error: '提案に失敗しました' }, { status: 500 })
  }
}
