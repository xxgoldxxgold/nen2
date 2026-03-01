import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { callClaude, checkRateLimit, logAIUsage } from '@/lib/ai'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const allowed = await checkRateLimit(db, user.id, 'field_assist')
  if (!allowed) return NextResponse.json({ error: 'AI利用回数の上限に達しました' }, { status: 429 })

  const { fields, title, content } = await request.json() as {
    fields: string[]
    title: string
    content: string
  }

  if (!fields || fields.length === 0) {
    return NextResponse.json({ error: 'fieldsを指定してください' }, { status: 400 })
  }

  const plainContent = (content || '').replace(/<[^>]*>/g, '').slice(0, 3000)

  const fieldDescriptions: Record<string, string> = {
    meta_description: 'メタディスクリプション（120〜160文字、SEO最適化、行動を促す表現）',
    excerpt: '記事の要約（2〜3文、300文字以内、読者が読みたくなる内容）',
    tags: 'タグ（3〜5個の配列）',
    seo_title: 'SEOタイトル（60文字以内、メインキーワードを前方に）',
  }

  const requestedFields = fields.filter(f => f in fieldDescriptions)
  if (requestedFields.length === 0) {
    return NextResponse.json({ error: '有効なフィールドがありません' }, { status: 400 })
  }

  const fieldList = requestedFields
    .map(f => `- "${f}": ${fieldDescriptions[f]}`)
    .join('\n')

  try {
    const result = await callClaude(
      `あなたはSEOとコンテンツマーケティングの専門家です。記事の内容に基づいて、指定されたフィールドの値をJSON形式で生成してください。

以下のフィールドを生成:
${fieldList}

出力形式（JSON以外のテキストは出力しない）:
{
  "field_name": "生成値",
  ...
}

tagsフィールドがある場合は配列で出力: "tags": ["タグ1", "タグ2"]`,
      `タイトル: ${title || '不明'}\n\n本文:\n${plainContent}`,
      1024,
    )

    await logAIUsage(db, user.id, 'field_assist')

    try {
      const parsed = JSON.parse(result)
      const results: Record<string, { value: unknown }> = {}
      for (const field of requestedFields) {
        if (field in parsed) {
          results[field] = { value: parsed[field] }
        }
      }
      return NextResponse.json({ results })
    } catch {
      return NextResponse.json({ error: 'AI応答のパースに失敗しました' }, { status: 500 })
    }
  } catch (error) {
    console.error('Field assist batch error:', error)
    return NextResponse.json({ error: 'AI生成に失敗しました' }, { status: 500 })
  }
}
