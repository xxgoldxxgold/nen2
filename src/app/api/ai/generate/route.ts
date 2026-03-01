import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { streamClaude, checkRateLimit, logAIUsage, getContextPrompt } from '@/lib/ai'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const allowed = await checkRateLimit(db, user.id, 'generate')
  if (!allowed) return NextResponse.json({ error: 'AI利用回数の上限に達しました' }, { status: 429 })

  const { title, keywords, tone } = await request.json()
  if (!title) return NextResponse.json({ error: 'タイトルは必須です' }, { status: 400 })

  const systemPrompt = `あなたは読者を惹きつける一流のブログライター兼編集者です。以下のルールに従って、人間が書いたような自然で読み応えのあるブログ記事をHTML形式で生成してください。

## 最重要ルール
- まずWeb検索ツールを使って、テーマに関する最新情報を調べてください。人物名、企業名、製品名、時事テーマなどは必ず検索してから書いてください
- 検索で得た情報と自分の知識を組み合わせて、正確で充実した記事を書いてください
- 「情報が見つかりません」「確認できません」などの断り文句は絶対に書かないでください
- 「検索します」「情報を集めます」「記事を作成します」などの作業過程の説明は絶対に出力しないでください。最初の1文字目から記事本文のHTMLだけを出力してください
- 人物について書く場合は、経歴、実績、エピソード、その人物の影響力や意義について深く掘り下げてください

## 文章スタイル
- 読者に直接語りかけるような、温かみのある文体で書く
- 抽象的な説明ではなく、具体的なエピソード・数字・事例を盛り込む
- 「〜です。〜です。」の単調な繰り返しを避け、文末表現に変化をつける（体言止め、問いかけ、感嘆など）
- 難しい専門用語は避け、必要なら平易な言葉で補足する
- 読者が「なるほど」「やってみよう」と思えるような実用的な情報を含める

## 構成
1. **導入**（2〜3段落）: 読者の共感や興味を引くエピソードや問いかけから始める。テーマの重要性を伝える
2. **本文**（3〜5セクション）: 各セクションにh2見出しをつけ、論理的に展開する。必要に応じてh3小見出し、箇条書き（ul/li）、強調（strong）を使い読みやすくする
3. **まとめ**（1〜2段落）: 記事の要点を簡潔に振り返り、読者への行動を促すメッセージで締める

## HTML形式
- 使用タグ: <h2>, <h3>, <p>, <ul>, <li>, <ol>, <strong>, <em>, <blockquote>
- <h1>は使わない（タイトルは別で表示される）
- HTMLタグ以外の装飾（マークダウンなど）は使わない
- コードブロックや説明文は不要。記事本文のHTMLのみを出力する

## トーン
${tone || 'プロフェッショナルだが親しみやすく、読みやすい'}`

  const contextPrompt = await getContextPrompt(db, user.id)
  const fullSystemPrompt = systemPrompt + contextPrompt

  const userPrompt = `以下のタイトルでブログ記事を書いてください。

まず「${title}」についてWeb検索で最新情報を調べてから、その情報を元に記事を書いてください。

タイトル: ${title}
${keywords?.length ? `キーワード: ${keywords.join(', ')}` : ''}

検索で得た正確な情報に基づいた、内容の濃い記事をお願いします。`

  try {
    const stream = streamClaude(fullSystemPrompt, userPrompt, 8192, 'claude-opus-4-6', true)

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          let buffer = ''
          let htmlStarted = false

          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const text = event.delta.text
              if (htmlStarted) {
                controller.enqueue(encoder.encode(text))
              } else {
                buffer += text
                const htmlIndex = buffer.indexOf('<')
                if (htmlIndex !== -1) {
                  htmlStarted = true
                  controller.enqueue(encoder.encode(buffer.slice(htmlIndex)))
                  buffer = ''
                }
              }
            }
          }
          controller.close()
          await logAIUsage(db, user.id, 'generate')
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    console.error('AI generate error:', error)
    return NextResponse.json({ error: 'AI生成に失敗しました' }, { status: 500 })
  }
}
