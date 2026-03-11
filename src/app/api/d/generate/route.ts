import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { callClaude } from '@/lib/ai'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { input, appName, category } = await request.json()
  if (!input || !category) {
    return NextResponse.json({ error: '入力とカテゴリが必要です' }, { status: 400 })
  }

  try {
    const systemPrompt = `あなたはプロダクトデザイナーです。ユーザーの改善要望を構造化されたデザイン仕様書に変換してください。

以下のJSON形式のみを返してください。他のテキストは不要です。
{
  "title": "仕様のタイトル（30文字以内）",
  "summary": "概要（100文字以内）",
  "priority": "高" | "中" | "低",
  "spec": {
    "background": "背景・課題の説明",
    "goal": "達成したいゴール",
    "requirements": ["要件1", "要件2", ...],
    "ui_changes": ["UI変更点1", "UI変更点2", ...],
    "acceptance_criteria": ["受け入れ基準1", "受け入れ基準2", ...],
    "notes": "補足事項（あれば）"
  }
}`

    const userPrompt = `対象アプリ: ${appName || 'NEN2'}
カテゴリ: ${category}
ユーザーの改善要望:
${input}`

    const raw = await callClaude(systemPrompt, userPrompt, 2048, 'claude-sonnet-4-6')
    const parsed = JSON.parse(raw)

    // Save to DB
    const { data: spec, error } = await db
      .from('design_specs')
      .insert({
        user_id: user.id,
        app_name: appName || 'NEN2',
        raw_input: input,
        category,
        title: parsed.title,
        summary: parsed.summary,
        priority: parsed.priority || '中',
        spec_json: parsed.spec,
      })
      .select('id, title, summary, priority, category, spec_json, created_at')
      .single()

    if (error) return NextResponse.json({ error: '仕様書の保存に失敗しました' }, { status: 500 })

    return NextResponse.json({ spec })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('Design spec generate error:', msg)
    return NextResponse.json({ error: '仕様書生成に失敗しました' }, { status: 500 })
  }
}

export const maxDuration = 60
