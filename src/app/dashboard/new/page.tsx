'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Editor from '@/components/Editor'
import { Save, Eye, ArrowLeft, Tags, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import TooltipHelp from '@/components/TooltipHelp'
import SeoSection from '@/components/SeoSection'
import FieldAssistButton from '@/components/FieldAssistButton'

export default function NewPostPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [seoTitle, setSeoTitle] = useState('')
  const [ogTitle, setOgTitle] = useState('')
  const [ogDescription, setOgDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [showMeta, setShowMeta] = useState(false)
  const [aiTagLoading, setAiTagLoading] = useState(false)
  const [aiImageLoading, setAiImageLoading] = useState(false)
  const [imagePrompt, setImagePrompt] = useState('')
  const [seoScore, setSeoScore] = useState(0)

  const handleImageUpload = useCallback(async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    if (!res.ok) throw new Error('Upload failed')
    const data = await res.json()
    return data.url
  }, [])

  const handleSave = async (status: 'draft' | 'published') => {
    if (!title.trim()) { alert('タイトルを入力してください'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          status,
          cover_image_url: coverImageUrl || null,
          meta_description: metaDescription || null,
          seo_title: seoTitle || null,
          og_title: ogTitle || null,
          og_description: ogDescription || null,
          tags,
          seo_score: seoScore,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || '保存に失敗しました')
        return
      }
      const post = await res.json()

      // Update state with auto-generated fields
      if (post.meta_description && !metaDescription) setMetaDescription(post.meta_description)
      if (post.tags?.length && tags.length === 0) setTags(post.tags)

      // Revalidate public page — get username from profile API
      try {
        const profRes = await fetch('/api/profile')
        if (profRes.ok) {
          const prof = await profRes.json()
          await fetch('/api/revalidate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: prof.username, slug: post.slug }),
          })
        }
      } catch {}

      router.push('/dashboard')
    } finally {
      setSaving(false)
    }
  }

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
      setTagInput('')
    }
  }

  const handleSuggestTags = async () => {
    setAiTagLoading(true)
    try {
      const res = await fetch('/api/ai/suggest-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.tags?.length) {
          setTags([...new Set([...tags, ...data.tags])])
        }
      }
    } finally {
      setAiTagLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
          戻る
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
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
            公開する
          </button>
        </div>
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="タイトル"
        className="w-full border-0 bg-transparent text-3xl font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none dark:text-white"
      />

      {/* Editor */}
      <Editor
        value={content}
        onChange={setContent}
        onImageUpload={handleImageUpload}
        title={title}
      />

      {/* Tags */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center gap-2 mb-3">
          <Tags className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">タグ</h3>
          <TooltipHelp text="記事の分類に使います。関連キーワードを追加すると読者が記事を見つけやすくなり、SEOにも効果的です。" />
          <button
            onClick={handleSuggestTags}
            disabled={aiTagLoading}
            className="ml-auto text-xs text-purple-600 hover:text-purple-700 disabled:opacity-50 dark:text-purple-400"
          >
            {aiTagLoading ? 'AI提案中...' : 'AIでタグ提案'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">
              {tag}
              <button onClick={() => setTags(tags.filter(t => t !== tag))} className="text-gray-400 hover:text-red-500">&times;</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag() } }}
            placeholder="タグを追加..."
            className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <button onClick={handleAddTag} className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700">
            追加
          </button>
        </div>
      </div>

      {/* Meta toggle */}
      <button
        onClick={() => setShowMeta(!showMeta)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
      >
        {showMeta ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        記事設定
      </button>

      {showMeta && (
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
              カバー画像URL
              <TooltipHelp text="記事一覧やSNSシェア時に表示されるサムネイルです。推奨サイズ: 1200x630px。" />
            </label>
            <input
              type="url"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="https://..."
            />
            <input
              type="text"
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="どんな画像がいい？（例: 夕焼けの海、ミニマルなデスク）"
            />
            <button
              onClick={async () => {
                setAiImageLoading(true)
                try {
                  const res = await fetch('/api/ai/generate-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, prompt: imagePrompt }),
                  })
                  const data = await res.json()
                  if (data.imageUrl) setCoverImageUrl(data.imageUrl)
                  else if (data.error) alert(data.error)
                } catch { alert('画像生成に失敗しました') }
                setAiImageLoading(false)
              }}
              disabled={aiImageLoading || (!title && !imagePrompt)}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-purple-50 px-3 py-2 text-xs font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50 dark:bg-purple-900/20 dark:text-purple-400"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {aiImageLoading ? '検索中...' : 'AIで画像を探す'}
            </button>
            {coverImageUrl && (
              <img src={coverImageUrl} alt="Cover preview" className="mt-2 h-32 w-full rounded-lg object-cover" />
            )}
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
              メタ説明文
              <TooltipHelp text="Googleの検索結果に表示される説明文です。160文字以内で記事内容を簡潔に要約しましょう。" />
              <FieldAssistButton field="meta_description" title={title} content={content} onApply={setMetaDescription} />
            </label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={2}
              maxLength={160}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="検索エンジンに表示される説明文（160文字以内）"
            />
            <p className="mt-1 text-right text-xs text-gray-400">{metaDescription.length}/160</p>
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
              SEOタイトル
              <TooltipHelp text="検索エンジン向けのタイトルです。60文字以内推奨。" />
              <FieldAssistButton field="seo_title" title={title} content={content} onApply={setSeoTitle} />
            </label>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="SEO用タイトル（60文字以内）"
              maxLength={60}
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
              OGタイトル
              <TooltipHelp text="SNSシェア時に表示されるタイトルです。" />
              <FieldAssistButton field="og_title" title={title} content={content} onApply={setOgTitle} />
            </label>
            <input
              type="text"
              value={ogTitle}
              onChange={(e) => setOgTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="OGタイトル"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
              OG説明文
              <TooltipHelp text="SNSシェア時に表示される説明文です。" />
              <FieldAssistButton field="og_description" title={title} content={content} onApply={setOgDescription} />
            </label>
            <textarea
              value={ogDescription}
              onChange={(e) => setOgDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="OG説明文"
            />
          </div>
          <SeoSection
            title={title}
            content={content}
            metaDescription={metaDescription}
            seoScore={seoScore}
            onScoreChange={setSeoScore}
          />
        </div>
      )}
    </div>
  )
}
