import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { streamClaude, checkRateLimit, logAIUsage } from '@/lib/ai'
import { NextResponse } from 'next/server'

// Status marker byte: chunks starting with \x00 are status messages
const STATUS_BYTE = 0x00

export async function POST(request: Request) {
  const supabase = await createClient()
  const db = createDataServer()

  const [{ data: { user } }, body] = await Promise.all([
    supabase.auth.getUser(),
    request.json(),
  ])
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { title, keywords, tone } = body
  if (!title) return NextResponse.json({ error: 'タイトルは必須です' }, { status: 400 })

  const allowed = await checkRateLimit(db, user.id, 'generate')
  if (!allowed) return NextResponse.json({ error: 'AI利用回数の上限に達しました' }, { status: 429 })

  const systemPrompt = `あなたは読者を惹きつける一流のブログライター兼編集者です。以下のルールに従って、人間が書いたような自然で読み応えのあるブログ記事をMarkdown形式で生成してください。

## 最重要ルール
- まずWeb検索ツールを使って、テーマに関する最新情報を調べてください。人物名、企業名、製品名、時事テーマなどは必ず検索してから書いてください
- 検索で得た情報と自分の知識を組み合わせて、正確で充実した記事を書いてください
- 「情報が見つかりません」「確認できません」などの断り文句は絶対に書かないでください
- 「検索します」「情報を集めます」「記事を作成します」などの作業過程の説明は絶対に出力しないでください。最初の1文字目から記事本文のMarkdownだけを出力してください
- 人物について書く場合は、経歴、実績、エピソード、その人物の影響力や意義について深く掘り下げてください

## 文章スタイル
- 読者に直接語りかけるような、温かみのある文体で書く
- 抽象的な説明ではなく、具体的なエピソード・数字・事例を盛り込む
- 「〜です。〜です。」の単調な繰り返しを避け、文末表現に変化をつける（体言止め、問いかけ、感嘆など）
- 難しい専門用語は避け、必要なら平易な言葉で補足する
- 読者が「なるほど」「やってみよう」と思えるような実用的な情報を含める

## 構成
1. **導入**（2〜3段落）: 読者の共感や興味を引くエピソードや問いかけから始める。テーマの重要性を伝える
2. **本文**（3〜5セクション）: 各セクションに## 見出しをつけ、論理的に展開する。必要に応じて### 小見出し、箇条書き、**強調**を使い読みやすくする
3. **まとめ**（1〜2段落）: 記事の要点を簡潔に振り返り、読者への行動を促すメッセージで締める

## Markdown形式
- 見出し: ## (h2)、### (h3)を使用。# (h1)は使わない
- 強調: **太字**、*イタリック*
- リスト: - 箇条書き、1. 番号付きリスト
- 引用: > 引用ブロック
- コード: \`インラインコード\`、\`\`\`コードブロック\`\`\`
- リンク: [テキスト](URL)
- Markdown以外の装飾（HTMLタグなど）は使わない。記事本文のMarkdownのみを出力する

## トーン
${tone || 'プロフェッショナルだが親しみやすく、読みやすい'}`

  const userPrompt = `以下のタイトルでブログ記事を書いてください。

まず「${title}」についてWeb検索で最新情報を調べてから、その情報を元に記事を書いてください。

タイトル: ${title}
${keywords?.length ? `キーワード: ${keywords.join(', ')}` : ''}

検索で得た正確な情報に基づいた、内容の濃い記事をお願いします。`

  try {
    const stream = streamClaude(systemPrompt, userPrompt, 8192, 'claude-sonnet-4-6', true)

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        const sendStatus = (msg: string) => {
          const bytes = encoder.encode(msg)
          const buf = new Uint8Array(1 + bytes.length)
          buf[0] = STATUS_BYTE
          buf.set(bytes, 1)
          controller.enqueue(buf)
        }

        try {
          let searchCount = 0
          let textStarted = false
          for await (const event of stream) {
            if (event.type === 'content_block_start') {
              const blockType = (event as any).content_block?.type
              if (blockType === 'server_tool_use' || blockType === 'tool_use') {
                searchCount++
                sendStatus(`Web検索中...（${searchCount}回目）`)
              } else if (blockType === 'text' && !textStarted) {
                textStarted = true
                sendStatus('記事を作成中...')
              }
            } else if (event.type === 'content_block_delta' && (event as any).delta?.type === 'text_delta') {
              controller.enqueue(encoder.encode((event as any).delta.text))
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
