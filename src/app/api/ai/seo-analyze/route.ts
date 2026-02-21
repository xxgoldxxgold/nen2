import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { callClaude, checkRateLimit, logAIUsage } from '@/lib/ai'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const allowed = await checkRateLimit(db, user.id, 'seo_analyze')
  if (!allowed) return NextResponse.json({ error: 'AI利用回数の上限に達しました' }, { status: 429 })

  const { title, content, metaDescription } = await request.json()

  try {
    const result = await callClaude(
      `あなたはSEOの専門家です。ブログ記事を分析し、以下のJSON形式で結果を返してください:
{
  "score": 0-100の整数,
  "suggestions": ["改善提案1", "改善提案2", ...]
}
評価基準:
- タイトルの長さと魅力（20点）
- 見出し構成（h2, h3の使用）（20点）
- 本文の長さと品質（20点）
- meta descriptionの有無と品質（20点）
- キーワードの適切な使用（20点）
JSON以外のテキストは出力しないでください。`,
      `タイトル: ${title || '（なし）'}
meta description: ${metaDescription || '（なし）'}
本文:
${content?.replace(/<[^>]*>/g, '').slice(0, 3000) || '（なし）'}`,
      512
    )

    await logAIUsage(db, user.id, 'seo_analyze')

    try {
      const parsed = JSON.parse(result)
      return NextResponse.json(parsed)
    } catch {
      return NextResponse.json({ score: 50, suggestions: ['SEO分析結果の解析に失敗しました'] })
    }
  } catch (error) {
    console.error('SEO analyze error:', error)
    return NextResponse.json({ error: 'SEO分析に失敗しました' }, { status: 500 })
  }
}
