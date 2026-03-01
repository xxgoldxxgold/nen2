import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { callClaude, checkRateLimit, logAIUsage, getContextPrompt } from '@/lib/ai'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const allowed = await checkRateLimit(db, user.id, 'rewrite')
  if (!allowed) return NextResponse.json({ error: 'AI利用回数の上限に達しました' }, { status: 429 })

  const { text, style } = await request.json()
  if (!text) return NextResponse.json({ error: 'テキストは必須です' }, { status: 400 })

  const stylePrompts: Record<string, string> = {
    improve: 'より読みやすく、自然で魅力的な文章にリライトしてください',
    concise: 'より簡潔に、要点を絞ってリライトしてください',
    detailed: 'より詳しく、具体例を交えてリライトしてください',
    casual: 'よりカジュアルで親しみやすいトーンにリライトしてください',
    formal: 'よりフォーマルでプロフェッショナルなトーンにリライトしてください',
  }

  try {
    const contextPrompt = await getContextPrompt(db, user.id)
    const result = await callClaude(
      'あなたはプロの編集者です。与えられたテキストを指示に従ってリライトしてください。リライト結果のみを出力し、説明は不要です。' + contextPrompt,
      `以下のテキストを${stylePrompts[style] || stylePrompts.improve}:\n\n${text}`,
      1024
    )

    await logAIUsage(db, user.id, 'rewrite')
    return NextResponse.json({ rewritten: result })
  } catch (error) {
    console.error('AI rewrite error:', error)
    return NextResponse.json({ error: 'リライトに失敗しました' }, { status: 500 })
  }
}
