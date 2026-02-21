'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createDataClient } from '@/lib/supabase/data-client'
import { Send, Palette, Type, Layout, Sparkles, Eye } from 'lucide-react'
import type { BlogTheme } from '@/lib/theme'
import { DEFAULT_THEME, deepMerge, generateInlineCSS, generateFontPreloads, migrateOldSettings } from '@/lib/theme'

const layoutTypes = [
  { id: 'single_column', name: 'シングル', desc: '1カラム、Medium風' },
  { id: 'two_column', name: '2カラム', desc: 'サイドバー付き' },
]

const headerStyles = [
  { id: 'left_aligned', name: '左寄せ' },
  { id: 'centered', name: '中央' },
  { id: 'minimal', name: 'ミニマル' },
]

const headingStyles = [
  { id: 'underline', name: '下線' },
  { id: 'left_border', name: '左ボーダー' },
  { id: 'background', name: '背景色' },
  { id: 'simple', name: 'シンプル' },
]

const cardStyles = [
  { id: 'minimal', name: 'ミニマル' },
  { id: 'card', name: 'カード' },
  { id: 'list', name: 'リスト' },
]

const fontOptions = [
  { value: "'Noto Sans JP', sans-serif", label: 'Noto Sans JP' },
  { value: "'Noto Serif JP', serif", label: 'Noto Serif JP（明朝）' },
  { value: "'M PLUS Rounded 1c', sans-serif", label: 'M PLUS Rounded 1c' },
  { value: "'M PLUS 1p', sans-serif", label: 'M PLUS 1p' },
  { value: "'Zen Maru Gothic', sans-serif", label: 'Zen Maru Gothic' },
  { value: "'Sawarabi Gothic', sans-serif", label: 'Sawarabi Gothic' },
  { value: "'Inter', sans-serif", label: 'Inter' },
  { value: "'Poppins', sans-serif", label: 'Poppins' },
  { value: "'Playfair Display', serif", label: 'Playfair Display' },
  { value: "'Merriweather', serif", label: 'Merriweather' },
]

export default function DesignPage() {
  const [settings, setSettings] = useState<BlogTheme>(DEFAULT_THEME)
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([])
  const [chatInput, setChatInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      const auth = createClient()
      const db = createDataClient()
      const { data: { session } } = await auth.auth.getSession()
      if (!session?.user) return
      const { data } = await db
        .from('users')
        .select('blog_settings')
        .eq('id', session.user.id)
        .single()
      if (data?.blog_settings) {
        setSettings(migrateOldSettings(data.blog_settings as Record<string, unknown>))
      }
    }
    fetchSettings()
  }, [])

  const updateSettings = (path: string, value: unknown) => {
    setSettings(prev => {
      const parts = path.split('.')
      const result = JSON.parse(JSON.stringify(prev))
      let obj = result
      for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]]
      obj[parts[parts.length - 1]] = value
      return result
    })
  }

  // Parse CSS into top-level blocks with proper brace matching
  const parseCSSBlocks = (css: string) => {
    const blocks: Array<{ selector: string; body: string }> = []
    let i = 0
    while (i < css.length) {
      const open = css.indexOf('{', i)
      if (open === -1) break
      const selector = css.substring(i, open)
      let depth = 1
      let j = open + 1
      while (j < css.length && depth > 0) {
        if (css[j] === '{') depth++
        if (css[j] === '}') depth--
        j++
      }
      blocks.push({ selector, body: css.substring(open + 1, j - 1) })
      i = j
    }
    return blocks
  }

  // Scope preview CSS so it doesn't leak into the dashboard
  const previewCSS = useMemo(() => {
    const raw = generateInlineCSS(settings)
    // Remove dark mode media query
    const css = raw.replace(/@media\(prefers-color-scheme:dark\)\{[^}]*\{[^}]*\}[^}]*\}/g, '')
    const blocks = parseCSSBlocks(css)
    const P = '.theme-preview'

    return blocks.map(({ selector, body }) => {
      const s = selector.trim()
      // @font-face — keep global
      if (s.startsWith('@font-face')) return `${s}{${body}}`
      // @media — scope inner selectors
      if (s.startsWith('@media')) {
        const inner = parseCSSBlocks(body)
        const scopedInner = inner.map(({ selector: iSel, body: iBody }) => {
          const is2 = iSel.trim()
          const scoped = is2.split(',').map(p => `${P} ${p.trim()}`).join(',')
          return `${scoped}{${iBody}}`
        }).join('')
        return `${s}{${scopedInner}}`
      }
      // :root / body → .theme-preview
      if (s === ':root' || s === 'body') return `${P}{${body}}`
      // Comma-separated or single selectors
      const scoped = s.split(',').map(p => {
        const t = p.trim()
        if (t === ':root' || t === 'body') return P
        return `${P} ${t}`
      }).join(',')
      return `${scoped}{${body}}`
    }).join('')
  }, [settings])

  const saveSettings = async () => {
    setSaving(true)
    const auth = createClient()
    const db = createDataClient()
    const { data: { session } } = await auth.auth.getSession()
    if (!session?.user) { setSaving(false); return }
    const user = session.user

    const toSave = {
      ...settings,
      css: { inline: generateInlineCSS(settings) },
      font_preload: generateFontPreloads(settings),
    }
    await db.from('users').update({ blog_settings: toSave }).eq('id', user.id)
    setSettings(toSave)
    setSaving(false)
  }

  const handleAIChat = async () => {
    if (!chatInput.trim()) return
    const userMessage = chatInput.trim()
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setChatInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage, currentSettings: settings }),
      })
      const data = await res.json()
      if (data.settings && Object.keys(data.settings).length > 0) {
        const newSettings = data.settings as BlogTheme
        setSettings(newSettings)
        // Auto-save to DB
        const authClient = createClient()
        const dbClient = createDataClient()
        const { data: { session: s } } = await authClient.auth.getSession()
        if (s?.user) {
          await dbClient.from('users').update({ blog_settings: newSettings }).eq('id', s.user.id)
        }
      }
      setChatMessages(prev => [...prev, {
        role: 'ai',
        content: data.message || 'デザインを更新しました（自動保存済み）',
      }])
    } catch {
      setChatMessages(prev => [...prev, {
        role: 'ai',
        content: 'エラーが発生しました。もう一度お試しください。',
      }])
    }
    setLoading(false)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ブログデザイン</h1>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? '保存中...' : 'デザインを保存'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Controls */}
        <div className="space-y-6">
          {/* Colors */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <Palette className="h-5 w-5" /> カラー
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {([
                ['colors.primary', 'プライマリ'],
                ['colors.background', '背景'],
                ['colors.surface', 'サーフェス'],
                ['colors.text', 'テキスト'],
                ['colors.text_secondary', 'テキスト(副)'],
                ['colors.text_muted', 'テキスト(薄)'],
                ['colors.border', 'ボーダー'],
                ['colors.link', 'リンク'],
                ['colors.link_hover', 'リンク(hover)'],
                ['colors.code_bg', 'コード背景'],
                ['colors.code_text', 'コード文字'],
              ] as const).map(([path, label]) => {
                const parts = path.split('.')
                let value: any = settings
                for (const p of parts) value = value?.[p]
                return (
                  <div key={path} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={value || '#000000'}
                      onChange={(e) => updateSettings(path, e.target.value)}
                      className="h-8 w-10 cursor-pointer rounded border border-gray-300"
                    />
                    <div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</p>
                      <p className="text-xs text-gray-400">{value}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Typography */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <Type className="h-5 w-5" /> フォント
            </h2>
            {(['heading', 'body'] as const).map(type => (
              <div key={type} className="mb-3">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {type === 'heading' ? '見出し' : '本文'}
                </label>
                <select
                  value={settings.typography.font_family[type]}
                  onChange={(e) => updateSettings(`typography.font_family.${type}`, e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  {fontOptions.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
            ))}
            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">ベースサイズ</label>
              <select
                value={settings.typography.font_size.base}
                onChange={(e) => updateSettings('typography.font_size.base', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                {['14px', '15px', '16px', '17px', '18px'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Layout */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <Layout className="h-5 w-5" /> レイアウト
            </h2>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {layoutTypes.map(lt => (
                <button
                  key={lt.id}
                  onClick={() => updateSettings('layout.type', lt.id)}
                  className={`rounded-lg border-2 p-3 text-left ${
                    settings.layout.type === lt.id
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{lt.name}</p>
                  <p className="text-xs text-gray-500">{lt.desc}</p>
                </button>
              ))}
            </div>

            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">ヘッダー</label>
            <div className="mb-4 flex gap-2">
              {headerStyles.map(h => (
                <button
                  key={h.id}
                  onClick={() => updateSettings('layout.header.style', h.id)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium ${
                    settings.layout.header.style === h.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400'
                  }`}
                >
                  {h.name}
                </button>
              ))}
            </div>

            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">見出し装飾</label>
            <div className="mb-4 flex gap-2">
              {headingStyles.map(h => (
                <button
                  key={h.id}
                  onClick={() => updateSettings('components.heading_style', h.id)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium ${
                    settings.components.heading_style === h.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400'
                  }`}
                >
                  {h.name}
                </button>
              ))}
            </div>

            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">記事カード</label>
            <div className="flex gap-2">
              {cardStyles.map(cs => (
                <button
                  key={cs.id}
                  onClick={() => updateSettings('components.article_card.style', cs.id)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium ${
                    settings.components.article_card.style === cs.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400'
                  }`}
                >
                  {cs.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: AI Chat + Preview */}
        <div className="space-y-6">
          {/* AI Chat */}
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <Sparkles className="h-5 w-5 text-purple-600" /> AIデザイン
              </h2>
              <p className="text-xs text-gray-500">「かわいいピンク系」「和風で落ち着いた雰囲気」など</p>
            </div>
            <div className="h-48 space-y-3 overflow-y-auto px-4 py-4">
              {chatMessages.length === 0 && (
                <p className="text-center text-sm text-gray-400">
                  自然言語でデザインを変更できます
                </p>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                  }`}>{msg.content}</div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-500 dark:bg-gray-800">考え中...</div>
                </div>
              )}
            </div>
            <div className="border-t border-gray-200 p-4 dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAIChat()}
                  placeholder="デザインの変更を指示..."
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                <button
                  onClick={handleAIChat}
                  disabled={loading || !chatInput.trim()}
                  className="rounded-lg bg-purple-600 px-3 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center gap-2 border-b border-gray-200 px-6 py-3 dark:border-gray-700">
              <Eye className="h-4 w-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">プレビュー</h2>
            </div>
            <div className="p-2">
              <style dangerouslySetInnerHTML={{ __html: previewCSS }} />
              <div className="theme-preview overflow-hidden rounded-lg border border-gray-200" style={{ fontSize: '12px' }}>
                <div className="header">
                  <div className="header-inner" style={{ padding: '0.7em 1em' }}>
                    <span className="logo" style={{ fontSize: '1em' }}>My Blog</span>
                    <nav className="nav"><a href="#" onClick={e => e.preventDefault()}>ホーム</a></nav>
                  </div>
                </div>
                <div className="container" style={{ padding: '1em' }}>
                  {settings.layout.type === 'two_column' ? (
                    <div className="two-col">
                      <div className="two-col__main">
                        <div className="article-list">
                          {['サンプル記事タイトル', '2番目の記事です'].map((title, i) => (
                            <div key={i} className="article-card">
                              <div className="article-card__thumbnail">
                                <div style={{
                                  aspectRatio: '16/9',
                                  background: `linear-gradient(135deg, ${settings.colors.primary}40, ${settings.colors.primary}10)`,
                                  borderRadius: '8px',
                                }} />
                              </div>
                              <div className="article-card__body">
                                <div className="article-card__title">{title}</div>
                                <p className="article-card__excerpt">プレビュー用のサンプルテキストです。</p>
                                <div className="article-card__meta">2025年1月15日</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <aside className="two-col__side">
                        <div className="sidebar-section">
                          <h3>プロフィール</h3>
                          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--c-text2)', margin: 0 }}>ブログの著者紹介</p>
                        </div>
                      </aside>
                    </div>
                  ) : (
                    <div className="article-list">
                      {['サンプル記事タイトル', '2番目の記事です'].map((title, i) => (
                        <div key={i} className="article-card">
                          <div className="article-card__thumbnail">
                            <div style={{
                              aspectRatio: '16/9',
                              background: `linear-gradient(135deg, ${settings.colors.primary}40, ${settings.colors.primary}10)`,
                              borderRadius: '8px',
                            }} />
                          </div>
                          <div className="article-card__body">
                            <div className="article-card__title">{title}</div>
                            <p className="article-card__excerpt">プレビュー用のサンプルテキストです。</p>
                            <div className="article-card__meta">2025年1月15日</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="footer" style={{ padding: '0.7em 0', fontSize: '0.8em' }}>
                  Powered by NEN2
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
