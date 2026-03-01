import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { callClaude, checkRateLimit, logAIUsage } from '@/lib/ai'
import { NextResponse } from 'next/server'

const fieldPrompts: Record<string, { system: string; format: string }> = {
  seo_title: {
    system: 'SEOに最適化されたページタイトルを生成するエキスパートです。',
    format: '60文字以内のSEOタイトルを1つだけ出力してください。説明不要。',
  },
  meta_description: {
    system: 'SEOメタディスクリプションを生成するエキスパートです。',
    format: '120〜160文字のメタディスクリプションを1つだけ出力してください。説明不要。',
  },
  og_title: {
    system: 'SNSシェア用のOGタイトルを生成するエキスパートです。',
    format: '40文字以内の魅力的なOGタイトルを1つだけ出力してください。説明不要。',
  },
  og_description: {
    system: 'SNSシェア用のOG説明文を生成するエキスパートです。',
    format: '80〜120文字のOG説明文を1つだけ出力してください。説明不要。',
  },
  excerpt: {
    system: 'ブログ記事の要約を生成するエキスパートです。',
    format: '100〜200文字の魅力的な要約を1つだけ出力してください。説明不要。',
  },
  tags: {
    system: 'ブログ記事のタグを提案するエキスパートです。',
    format: '最適なタグを3〜5個、JSON配列で出力してください（例: ["タグ1","タグ2"]）。説明不要。',
  },
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const allowed = await checkRateLimit(db, user.id, 'field_assist')
  if (!allowed) return NextResponse.json({ error: 'AI利用回数の上限に達しました' }, { status: 429 })

  const { field, title, content, context_notes } = await request.json()
  if (!field || !fieldPrompts[field]) {
    return NextResponse.json({ error: '無効なフィールドです' }, { status: 400 })
  }

  const fp = fieldPrompts[field]

  // Check for custom instruction
  const { data: customInst } = await db
    .from('nen2_ai_field_instructions')
    .select('instruction')
    .eq('user_id', user.id)
    .eq('field_name', field)
    .eq('is_active', true)
    .single()

  let systemPrompt = fp.system
  if (customInst?.instruction) {
    systemPrompt += `\n\nユーザーの追加指示: ${customInst.instruction}`
  }
  if (context_notes) {
    systemPrompt += `\n\n${context_notes}`
  }

  const userPrompt = `以下のブログ記事について、${fp.format}\n\nタイトル: ${title || '(未設定)'}\n本文: ${(content || '').slice(0, 3000)}`

  try {
    const result = await callClaude(systemPrompt, userPrompt, 512)
    await logAIUsage(db, user.id, 'field_assist')
    return NextResponse.json({ result: result.trim() })
  } catch (error) {
    console.error('Field assist error:', error)
    return NextResponse.json({ error: 'AI生成に失敗しました' }, { status: 500 })
  }
}
