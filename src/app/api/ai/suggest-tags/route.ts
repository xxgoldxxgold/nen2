import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { callClaude, checkRateLimit, logAIUsage, getContextPrompt } from '@/lib/ai'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const allowed = await checkRateLimit(db, user.id, 'suggest_tags')
  if (!allowed) return NextResponse.json({ error: 'AI利用回数の上限に達しました' }, { status: 429 })

  const { title, content } = await request.json()

  try {
    const contextPrompt = await getContextPrompt(db, user.id)
    const result = await callClaude(
      'あなたはブログのタグ付けの専門家です。記事の内容に基づいて最適なタグを3〜5個提案してください。JSON配列形式で出力してください（例: ["タグ1", "タグ2", "タグ3"]）。JSON以外のテキストは出力しないでください。' + contextPrompt,
      `タイトル: ${title || '不明'}\n本文: ${content?.replace(/<[^>]*>/g, '').slice(0, 2000) || '不明'}`,
      256
    )

    await logAIUsage(db, user.id, 'suggest_tags')

    try {
      const tags = JSON.parse(result)
      return NextResponse.json({ tags: Array.isArray(tags) ? tags : [] })
    } catch {
      return NextResponse.json({ tags: [] })
    }
  } catch (error) {
    console.error('Tag suggest error:', error)
    return NextResponse.json({ error: 'タグ提案に失敗しました' }, { status: 500 })
  }
}
