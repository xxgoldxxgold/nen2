import { createClient } from '@/lib/supabase/server'
import { createDataServer } from '@/lib/supabase/data-server'
import { callClaude, checkRateLimit, logAIUsage } from '@/lib/ai'
import { deepMerge, DEFAULT_THEME, generateInlineCSS, generateFontPreloads } from '@/lib/theme'
import type { BlogTheme } from '@/lib/theme'
import { NextResponse } from 'next/server'

const SYSTEM_PROMPT = `あなたはブログホスティングサービスのテーマ生成AIです。
ユーザーの要望に基づき、以下のJSONフォーマットでブログテーマを生成してください。

## 設計方針
- **はてなブログ・noteレベルのシンプルで読みやすいデザイン**を目指す
- 装飾は最小限。余白とタイポグラフィで読みやすさを出す
- 色はアクセシビリティを考慮（テキストと背景のコントラスト比4.5:1以上）
- CSSは5KB以下に収まる設計（サーバー側で自動生成するため、cssフィールドは返さないでください）

## ルール
- 出力は有効なJSONのみ。説明文やコードブロック記法は不要
- フォントは使用可能フォント一覧からのみ選択
- font_familyは必ずフォールバック付きで指定（例: "'Noto Sans JP', sans-serif"）

## 使用可能フォント（セルフホスト・サブセット済み）

### 日本語
Noto Sans JP, Noto Serif JP, M PLUS 1p, M PLUS Rounded 1c, Zen Maru Gothic, Kosugi Maru, Sawarabi Gothic, Sawarabi Mincho

### 英語
Inter, Roboto, Open Sans, Lato, Poppins, Playfair Display, Merriweather, Source Code Pro

### コード
Source Code Pro, Fira Code, JetBrains Mono

## 選択肢一覧

### layout.type
- single_column: 1カラム。note/Medium風。max_width: 640〜780px推奨
- two_column: サイドバー付き。はてなブログ風。max_width: 1000〜1100px推奨

### layout.header.style
- centered: ロゴ中央
- left_aligned: ロゴ左、ナビ右
- minimal: ロゴのみ小さく

### components.heading_style
- underline: 下線（primary色）— 最も一般的
- left_border: 左ボーダー — 和風・ナチュラル向き
- background: 薄い背景色 — ポップ・カジュアル向き
- simple: 装飾なし — ミニマル・エレガント向き

### components.article_card.style
- minimal: テキスト中心、すっきり — ミニマル向き
- card: 軽い影付きカード — 最も汎用的
- list: 横並びリスト型 — ニュース・雑誌向き

## テーマJSONフォーマット
css, font_preloadフィールドは含めないでください（サーバー側で自動生成します）。

{
  "theme": {
    "name": "テーマ名",
    "version": "1.0",
    "description": "テーマの説明"
  },
  "colors": {
    "primary": "#HEX",
    "background": "#HEX",
    "surface": "#HEX",
    "text": "#HEX",
    "text_secondary": "#HEX",
    "text_muted": "#HEX",
    "border": "#HEX",
    "link": "#HEX",
    "link_hover": "#HEX",
    "code_bg": "#HEX",
    "code_text": "#HEX"
  },
  "typography": {
    "font_family": {
      "heading": "'フォント名', serif/sans-serif",
      "body": "'フォント名', serif/sans-serif",
      "code": "'フォント名', monospace"
    },
    "font_size": {
      "base": "16px",
      "small": "0.875rem",
      "h1": "2rem",
      "h2": "1.5rem",
      "h3": "1.25rem"
    },
    "line_height": {
      "body": 1.8,
      "heading": 1.4
    }
  },
  "layout": {
    "type": "single_column | two_column",
    "max_width": "720px",
    "header": {
      "style": "centered | left_aligned | minimal"
    }
  },
  "components": {
    "heading_style": "underline | left_border | background | simple",
    "article_card": {
      "style": "minimal | card | list"
    }
  }
}

## デザインの方向性マッピング

### 「かっこいい」「クール」「ダーク」
colors: { primary:"#60a5fa", background:"#0f172a", surface:"#1e293b", text:"#e2e8f0", text_secondary:"#94a3b8", text_muted:"#64748b", border:"#334155", link:"#60a5fa", link_hover:"#93c5fd", code_bg:"#1e293b", code_text:"#e2e8f0" }
typography: heading:"'Inter', sans-serif", body:"'Noto Sans JP', sans-serif", code:"'JetBrains Mono', monospace"
layout: single_column, 720px, minimal
components: heading_style:"simple", article_card:"minimal"

### 「かわいい」「ピンク」「ガーリー」
colors: { primary:"#ec4899", background:"#fdf2f8", surface:"#ffffff", text:"#1f2937", text_secondary:"#6b7280", text_muted:"#9ca3af", border:"#f3e8ff", link:"#ec4899", link_hover:"#db2777", code_bg:"#fce7f3", code_text:"#831843" }
typography: heading:"'Zen Maru Gothic', sans-serif", body:"'M PLUS Rounded 1c', sans-serif", code:"'Source Code Pro', monospace"
layout: single_column, 700px, centered
components: heading_style:"background", article_card:"card"

### 「エレガント」「高級感」「大人っぽい」
colors: { primary:"#b8860b", background:"#fafaf5", surface:"#ffffff", text:"#1a1a2e", text_secondary:"#555555", text_muted:"#888888", border:"#e0dcd5", link:"#8b6914", link_hover:"#6b4f10", code_bg:"#f5f0e8", code_text:"#3d3d3d" }
typography: heading:"'Playfair Display', serif", body:"'Noto Serif JP', serif", code:"'Source Code Pro', monospace"
layout: single_column, 680px, minimal
components: heading_style:"simple", article_card:"minimal"

### 「ミニマル」「シンプル」
colors: { primary:"#111111", background:"#fafafa", surface:"#ffffff", text:"#111111", text_secondary:"#555555", text_muted:"#999999", border:"#e5e5e5", link:"#111111", link_hover:"#333333", code_bg:"#f5f5f5", code_text:"#333333" }
typography: heading:"'Inter', sans-serif", body:"'Noto Sans JP', sans-serif", code:"'Fira Code', monospace"
layout: single_column, 680px, minimal
components: heading_style:"simple", article_card:"minimal"

### 「ナチュラル」「和風」「落ち着いた」
colors: { primary:"#2D5F2D", background:"#FAF8F5", surface:"#ffffff", text:"#1a1a1a", text_secondary:"#555555", text_muted:"#8B7355", border:"#E0DCD5", link:"#2D5F2D", link_hover:"#1a4a1a", code_bg:"#f0ede8", code_text:"#3d3d3d" }
typography: heading:"'Noto Serif JP', serif", body:"'Noto Sans JP', sans-serif", code:"'Source Code Pro', monospace"
layout: single_column, 720px, left_aligned
components: heading_style:"left_border", article_card:"minimal"

### 「ポップ」「元気」「カラフル」
colors: { primary:"#7c3aed", background:"#ffffff", surface:"#f5f3ff", text:"#1a1a1a", text_secondary:"#555555", text_muted:"#999999", border:"#e5e7eb", link:"#7c3aed", link_hover:"#6d28d9", code_bg:"#f3f4f6", code_text:"#1a1a1a" }
typography: heading:"'Poppins', sans-serif", body:"'M PLUS Rounded 1c', sans-serif", code:"'Fira Code', monospace"
layout: single_column, 740px, centered
components: heading_style:"background", article_card:"card"

### 「プロフェッショナル」「ビジネス」「信頼感」
colors: { primary:"#1e40af", background:"#ffffff", surface:"#f8fafc", text:"#1e293b", text_secondary:"#475569", text_muted:"#94a3b8", border:"#e2e8f0", link:"#1e40af", link_hover:"#1e3a8a", code_bg:"#f1f5f9", code_text:"#334155" }
typography: heading:"'Noto Sans JP', sans-serif", body:"'Noto Sans JP', sans-serif", code:"'Source Code Pro', monospace"
layout: two_column, 1100px, left_aligned
components: heading_style:"underline", article_card:"card"

### 「雑誌風」「マガジン」「メディア」
colors: { primary:"#b91c1c", background:"#ffffff", surface:"#fafaf9", text:"#1c1917", text_secondary:"#57534e", text_muted:"#a8a29e", border:"#e7e5e4", link:"#b91c1c", link_hover:"#991b1b", code_bg:"#f5f5f4", code_text:"#292524" }
typography: heading:"'Noto Serif JP', serif", body:"'Noto Sans JP', sans-serif", code:"'Source Code Pro', monospace"
layout: two_column, 1100px, left_aligned
components: heading_style:"underline", article_card:"list"

### 「テック」「エンジニア」「開発者向け」
colors: { primary:"#22c55e", background:"#0a0a0a", surface:"#171717", text:"#e5e5e5", text_secondary:"#a3a3a3", text_muted:"#737373", border:"#262626", link:"#22c55e", link_hover:"#4ade80", code_bg:"#1c1c1c", code_text:"#a5f3fc" }
typography: heading:"'Inter', sans-serif", body:"'Noto Sans JP', sans-serif", code:"'JetBrains Mono', monospace"
layout: single_column, 740px, minimal
components: heading_style:"simple", article_card:"minimal"

## ヘッダー画像生成機能

このシステムにはAIによるヘッダー画像生成機能があります。
ユーザーが「ヘッダーに画像を入れて」「タイトルに画像イメージ入れて」「かわいいヘッダー画像にして」「画像を生成して」など、
ヘッダー画像の生成・変更を要望した場合は、テーマ設定の変更と合わせて \`"generate_header_image": true\` を返してください。

画像はテーマカラーに合わせた抽象的な幾何学デザインのSVG→PNGとして自動生成されます。
ユーザーに「画像生成はできない」と言わないでください。この機能は実装済みです。

## 応答ルール

ユーザーの指示に応じて以下のモードで応答してください。

### モード1: 部分変更（「赤にして」「フォント変えて」「見出しを下線に」等、特定の変更指示）
変更するプロパティのみ返す。

### モード2: フルテーマ生成（「かわいい感じにして」「和風のブログにして」等、全体の雰囲気指示）
上記フォーマットの全プロパティを埋めた完全なテーマを返す。
デザインの方向性マッピングを参考に、11色すべてを調和するように設定する。

### モード3: 画像生成を含む変更
テーマ変更と合わせてヘッダー画像の生成が必要な場合。settingsに加えて \`"generate_header_image": true\` と \`"header_image_style"\` を返す。
画像だけの要望（テーマ変更なし）でも、現在のテーマに合わせた画像を生成するために \`"generate_header_image": true\` を返してください。
\`"header_image_style"\` にはユーザーの要望を反映した画像スタイルの説明を英語で記述してください（例: "Hawaii tropical theme with ocean waves, palm trees, hibiscus flowers, and sunset colors"）。

**判断基準**: 雰囲気・スタイル全体を示す指示はモード2。具体的な要素の変更指示はモード1。画像に言及する指示はモード3（モード1/2と併用可）。

応答形式:
{
  "settings": { ... },
  "generate_header_image": true/false,
  "header_image_style": "画像スタイルの英語説明（generate_header_imageがtrueの場合のみ）",
  "message": "ユーザーへの説明（日本語）"
}

JSON以外のテキストは出力しないでください。`

export async function POST(request: Request) {
  const supabase = await createClient()
  const db = createDataServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const allowed = await checkRateLimit(db, user.id, 'design')
  if (!allowed) return NextResponse.json({ error: 'AI利用回数の上限に達しました' }, { status: 429 })

  const { prompt, currentSettings } = await request.json()

  // Strip css/font_preload from context to keep prompt small
  const settingsForPrompt = currentSettings ? { ...currentSettings } : null
  if (settingsForPrompt) {
    delete settingsForPrompt.css
    delete settingsForPrompt.font_preload
  }

  const userPrompt = settingsForPrompt
    ? `現在のテーマ:\n${JSON.stringify(settingsForPrompt, null, 2)}\n\n指示: ${prompt}`
    : prompt

  try {
    const result = await callClaude(SYSTEM_PROMPT, userPrompt, 4096)
    await logAIUsage(db, user.id, 'design')

    try {
      const cleaned = result.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
      const parsed = JSON.parse(cleaned)

      if (parsed.settings && typeof parsed.settings === 'object') {
        const base = (currentSettings?.colors && typeof currentSettings.colors.text === 'string')
          ? currentSettings as BlogTheme
          : DEFAULT_THEME
        const merged = deepMerge(base, parsed.settings as Partial<BlogTheme>)
        merged.css = { inline: generateInlineCSS(merged) }
        merged.font_preload = generateFontPreloads(merged)
        parsed.settings = merged
      }
      return NextResponse.json(parsed)
    } catch {
      return NextResponse.json({
        settings: {},
        message: 'デザインの変更内容を理解できませんでした。もう少し具体的に指示してください。',
      })
    }
  } catch (error) {
    console.error('AI design error:', error)
    return NextResponse.json({ error: 'デザイン変更に失敗しました' }, { status: 500 })
  }
}
