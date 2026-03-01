import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { callClaude, checkRateLimit, logAIUsage, getContextPrompt } from '@/lib/ai'
import { NextResponse } from 'next/server'

const FIELD_INSTRUCTIONS: Record<string, string> = {
  meta_description: '記事のタイトルと本文から、検索エンジンに最適化されたメタディスクリプションを生成してください。120〜160文字。行動を促す表現を含め、メインキーワードを自然に盛り込んでください。出力はメタディスクリプションのテキストのみ。',
  excerpt: '記事の概要を2〜3文で生成してください。読者が記事を読むか判断できる、魅力的な要約にしてください。300文字以内。出力は要約テキストのみ。',
  tags: '記事の内容から適切なタグを3〜5個提案してください。JSON配列形式で出力してください（例: ["タグ1", "タグ2"]）。JSON以外のテキストは出力しないでください。',
  seo_title: '記事のタイトルと本文から、検索エンジンに最適化されたSEOタイトルを生成してください。60文字以内。メインキーワードを前方に配置し、クリックしたくなるタイトルにしてください。出力はタイトルテキストのみ。',
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const allowed = await checkRateLimit(db, user.id, 'field_assist')
  if (!allowed) return NextResponse.json({ error: 'AI利用回数の上限に達しました' }, { status: 429 })

  const { field_name, title, content } = await request.json()

  const instruction = FIELD_INSTRUCTIONS[field_name]
  if (!instruction) {
    return NextResponse.json({ error: `不明なフィールド: ${field_name}` }, { status: 400 })
  }

  try {
    const plainContent = (content || '').replace(/<[^>]*>/g, '').slice(0, 3000)
    const contextPrompt = await getContextPrompt(db, user.id)

    const result = await callClaude(
      `あなたはSEOとコンテンツマーケティングの専門家です。指示に従って正確にフィールドの値を生成してください。\n\n${instruction}` + contextPrompt,
      `タイトル: ${title || '不明'}\n\n本文:\n${plainContent}`,
      512,
    )

    await logAIUsage(db, user.id, 'field_assist')

    // Parse result based on field type
    if (field_name === 'tags') {
      try {
        const tags = JSON.parse(result)
        return NextResponse.json({ field_name, generated_value: Array.isArray(tags) ? tags : [] })
      } catch {
        return NextResponse.json({ field_name, generated_value: [] })
      }
    }

    return NextResponse.json({ field_name, generated_value: result.trim() })
  } catch (error) {
    console.error('Field assist error:', error)
    return NextResponse.json({ error: 'AI生成に失敗しました' }, { status: 500 })
  }
}
