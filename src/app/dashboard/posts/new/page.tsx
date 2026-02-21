'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createDataClient } from '@/lib/supabase/data-client'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Save, Eye, Clock, Sparkles, ArrowLeft, ChevronDown, Settings2, HelpCircle } from 'lucide-react'
import Link from 'next/link'

const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor'), { ssr: false })

export default function NewPostPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [contentHtml, setContentHtml] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [status, setStatus] = useState<'draft' | 'published' | 'scheduled'>('draft')
  const [publishedAt, setPublishedAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [seoScore, setSeoScore] = useState<number | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null)

  // Auto-generate slug from title
  useEffect(() => {
    if (title) {
      const generated = title
        .toLowerCase()
        .replace(/[^\w\s\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 200)
      setSlug(generated || `post-${Date.now()}`)
    }
  }, [title])

  const handleSave = async (saveStatus?: 'draft' | 'published' | 'scheduled') => {
    const finalStatus = saveStatus || status
    setSaving(true)

    const auth = createClient()
    const db = createDataClient()
    const { data: { session } } = await auth.auth.getSession()
    if (!session?.user) { router.push('/login'); return }
    const user = session.user

    // Ensure unique slug
    let finalSlug = slug || `post-${Date.now()}`
    const { count } = await db
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('slug', finalSlug)
    if (count && count > 0) {
      finalSlug = `${finalSlug}-${Date.now()}`
    }

    const postData = {
      user_id: user.id,
      title: title || '無題の記事',
      slug: finalSlug,
      content: JSON.stringify(content),
      content_html: contentHtml,
      excerpt: excerpt || contentHtml?.replace(/<[^>]*>/g, '').slice(0, 300) || '',
      cover_image_url: coverImageUrl || null,
      meta_description: metaDescription || null,
      status: finalStatus,
      seo_score: seoScore || 0,
      published_at: finalStatus === 'published' ? new Date().toISOString()
        : finalStatus === 'scheduled' && publishedAt ? new Date(publishedAt).toISOString()
        : null,
    }

    const { data, error } = await db.from('blog_posts').insert(postData).select().single()

    if (error) {
      console.error('Save error:', error)
      alert('保存に失敗しました: ' + error.message)
      setSaving(false)
      return
    }

    // Save tags
    if (tags.length > 0 && data) {
      for (const tagName of tags) {
        const { data: existingTag } = await db
          .from('blog_tags')
          .select('id')
          .eq('name', tagName)
          .single()

        let tagId: string
        if (existingTag) {
          tagId = existingTag.id
        } else {
          const { data: newTag } = await db
            .from('blog_tags')
            .insert({ name: tagName })
            .select('id')
            .single()
          tagId = newTag!.id
        }

        await db.from('blog_post_tags').insert({ post_id: data.id, tag_id: tagId })
      }
    }

    setSaving(false)
    router.push(`/dashboard/posts/${data.id}/edit`)
  }

  const handleAIGenerate = async () => {
    if (!title) {
      alert('まずタイトルを入力してください')
      return
    }
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, keywords: tags }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'AI生成に失敗しました')
        setAiLoading(false)
        return
      }

      // Stream reading - update editor in real-time
      const reader = res.body?.getReader()
      if (!reader) throw new Error('No reader')
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setContentHtml(accumulated)
        setContent(accumulated)
      }

      // Generate excerpt/meta from final content
      const plainText = accumulated.replace(/<[^>]*>/g, '')
      if (!excerpt) setExcerpt(plainText.slice(0, 300))
      if (!metaDescription) setMetaDescription(plainText.slice(0, 155))
    } catch (err) {
      console.error('AI generate error:', err)
      alert('AI生成に失敗しました。ネットワーク接続を確認してください。')
    }
    setAiLoading(false)
  }

  const handleAIRewrite = async (text: string): Promise<string | undefined> => {
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, style: 'improve' }),
      })
      const data = await res.json()
      if (data.rewritten) {
        setAiLoading(false)
        return data.rewritten
      }
    } catch (err) {
      console.error('AI rewrite error:', err)
    }
    setAiLoading(false)
    return undefined
  }

  const handleAISuggest = async (context: string) => {
    try {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, title }),
      })
      const data = await res.json()
      if (data.suggestion) {
        // Append suggestion to content
        setContentHtml(prev => prev + data.suggestion)
      }
    } catch (err) {
      console.error('AI suggest error:', err)
    }
  }

  const handleSEOAnalyze = async () => {
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/seo-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: contentHtml, metaDescription }),
      })
      const data = await res.json()
      if (data.score !== undefined) {
        setSeoScore(data.score)
        if (data.suggestions) {
          alert(`SEOスコア: ${data.score}/100\n\n改善提案:\n${data.suggestions.join('\n')}`)
        }
      }
    } catch (err) {
      console.error('SEO analyze error:', err)
    }
    setAiLoading(false)
  }

  const handleSuggestTags = async () => {
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/suggest-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: contentHtml }),
      })
      const data = await res.json()
      if (data.tags) {
        setTags(prev => [...new Set([...prev, ...data.tags])])
      }
    } catch (err) {
      console.error('Tag suggest error:', err)
    }
    setAiLoading(false)
  }

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()])
      }
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/posts" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">新規記事作成</h1>
        </div>
        <div className="flex items-center gap-3">
          {seoScore !== null && (
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${
              seoScore >= 80 ? 'bg-green-100 text-green-700' :
              seoScore >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
            }`}>
              SEO: {seoScore}
            </span>
          )}
          <button
            onClick={handleSEOAnalyze}
            disabled={aiLoading || !contentHtml}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            SEO分析
          </button>
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <Save className="h-4 w-4" />
            下書き保存
          </button>
          <button
            onClick={() => handleSave('published')}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Eye className="h-4 w-4" />
            公開
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-4 lg:col-span-2">
          <input
            type="text"
            placeholder="記事タイトルを入力..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border-0 bg-transparent text-3xl font-bold text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-0 dark:text-white dark:placeholder-gray-600"
          />

          {aiLoading && (
            <div className="flex items-center gap-2 rounded-lg bg-purple-50 px-4 py-3 text-sm text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
              <Sparkles className="h-4 w-4 animate-spin" />
              AIが処理中...
            </div>
          )}

          <RichTextEditor
            content={contentHtml || content}
            onChange={(c, html) => { setContent(c); setContentHtml(html) }}
            onAIGenerate={handleAIGenerate}
            onAIRewrite={handleAIRewrite}
            onAISuggest={handleAISuggest}
          />
        </div>

        {/* Sidebar - Options panel */}
        <div>
          <OptionsPanel defaultOpen={false}>
            <OptionItem label="URLスラッグ" tooltip="記事URLの末尾部分。タイトルから自動生成されますが手動変更も可能です">
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </OptionItem>

            <OptionItem label="抄録" tooltip="記事一覧やSNSシェア時に表示される要約文。空欄なら本文から自動生成されます">
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                maxLength={300}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="記事の要約（省略時は本文から自動生成）"
              />
            </OptionItem>

            <OptionItem label="アイキャッチ画像" tooltip="記事のカバー画像。URLを貼るか、AIで自動生成できます">
              <input
                type="url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="画像URL"
              />
              {coverImageUrl && <img src={coverImageUrl} alt="" className="mt-2 rounded-lg" />}
              <button
                onClick={async () => {
                  setAiLoading(true)
                  try {
                    const res = await fetch('/api/ai/generate-image', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ title, content: contentHtml }),
                    })
                    const data = await res.json()
                    if (data.imageUrl) setCoverImageUrl(data.imageUrl)
                  } catch { alert('画像生成に失敗しました') }
                  setAiLoading(false)
                }}
                disabled={aiLoading || !title}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-purple-50 px-3 py-2 text-xs font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50 dark:bg-purple-900/20 dark:text-purple-400"
              >
                <Sparkles className="h-3.5 w-3.5" />
                AIでアイキャッチ生成
              </button>
            </OptionItem>

            <OptionItem label="meta description" tooltip="Google検索結果に表示される説明文（最大160文字）。SEOに直結する重要項目です">
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={2}
                maxLength={160}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="検索結果に表示される説明文"
              />
              <p className="mt-1 text-right text-xs text-gray-400">{metaDescription.length}/160</p>
            </OptionItem>

            <OptionItem
              label={`タグ${tags.length > 0 ? ` (${tags.length})` : ''}`}
              tooltip="記事の分類用タグ。読者がタグで記事を絞り込めます。AI提案も可能"
              action={
                <button
                  onClick={handleSuggestTags}
                  disabled={aiLoading || !contentHtml}
                  className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 disabled:opacity-50"
                >
                  <Sparkles className="h-3 w-3" />
                  AI提案
                </button>
              }
            >
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="text-gray-400 hover:text-gray-600">&times;</button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={addTag}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="タグを入力してEnter"
              />
            </OptionItem>

            <OptionItem label="予約公開" tooltip="日時を指定して記事を自動公開。指定しなければ即時公開されます">
              <input
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              {publishedAt && (
                <button
                  onClick={() => handleSave('scheduled')}
                  disabled={saving}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Clock className="h-3.5 w-3.5" />
                  予約公開する
                </button>
              )}
            </OptionItem>
          </OptionsPanel>
        </div>
      </div>
    </div>
  )
}

function OptionsPanel({ defaultOpen, children }: { defaultOpen: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          <Settings2 className="h-4 w-4" />
          オプション設定
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="space-y-5 border-t border-gray-200 px-4 pb-4 pt-4 dark:border-gray-700">{children}</div>}
    </div>
  )
}

function OptionItem({
  label, tooltip, children, action,
}: {
  label: string; tooltip: string; children: React.ReactNode; action?: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <div className="group relative flex items-center gap-1.5">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
          <HelpCircle className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />
          <div className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 w-56 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-gray-700">
            {tooltip}
            <div className="absolute -bottom-1 left-4 h-2 w-2 rotate-45 bg-gray-900 dark:bg-gray-700" />
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}
