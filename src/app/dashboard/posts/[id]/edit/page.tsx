'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createDataClient } from '@/lib/supabase/data-client'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Save, Eye, EyeOff, Trash2, Sparkles, ArrowLeft, ChevronDown, Settings2, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import type { Post } from '@/lib/types'
import VersionHistory from '@/components/editor/VersionHistory'
import TranslationPanel from '@/components/editor/TranslationPanel'

const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor'), { ssr: false })

export default function EditPostPage() {
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string

  const [post, setPost] = useState<Post | null>(null)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [contentHtml, setContentHtml] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [status, setStatus] = useState<'draft' | 'published' | 'scheduled'>('draft')
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [seoScore, setSeoScore] = useState<number>(0)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [fieldAssisting, setFieldAssisting] = useState<string | null>(null)

  useEffect(() => {
    const fetchPost = async () => {
      const db = createDataClient()
      const { data: post } = await db
        .from('blog_posts')
        .select('*')
        .eq('id', postId)
        .single()

      if (!post) {
        router.push('/dashboard/posts')
        return
      }

      setPost(post)
      setTitle(post.title)
      setSlug(post.slug)
      setContent(post.content || '')
      setContentHtml(post.content_html || '')
      setExcerpt(post.excerpt || '')
      setCoverImageUrl(post.cover_image_url || '')
      setMetaDescription(post.meta_description || '')
      setStatus(post.status as 'draft' | 'published' | 'scheduled')
      setSeoScore(post.seo_score || 0)

      // Fetch tags
      const { data: postTags } = await db
        .from('blog_post_tags')
        .select('tag_id, blog_tags(name)')
        .eq('post_id', postId)

      if (postTags) {
        setTags(postTags.map((pt: any) => pt.blog_tags?.name).filter(Boolean))
      }

      setLoading(false)
    }

    fetchPost()
  }, [postId, router])

  const handleSave = async (saveStatus?: 'draft' | 'published') => {
    const finalStatus = saveStatus || status
    setSaving(true)

    const db = createDataClient()
    const { error } = await db
      .from('blog_posts')
      .update({
        title,
        slug,
        content: typeof content === 'string' ? content : JSON.stringify(content),
        content_html: contentHtml,
        excerpt,
        cover_image_url: coverImageUrl || null,
        meta_description: metaDescription || null,
        status: finalStatus,
        seo_score: seoScore,
        published_at: finalStatus === 'published' && !post?.published_at
          ? new Date().toISOString()
          : post?.published_at,
      })
      .eq('id', postId)

    if (error) {
      alert('保存に失敗しました: ' + error.message)
      setSaving(false)
      return
    }

    setStatus(finalStatus)

    // Save tags: delete old relations, insert new ones
    await db.from('blog_post_tags').delete().eq('post_id', postId)
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

      await db.from('blog_post_tags').insert({ post_id: postId, tag_id: tagId })
    }

    // Create version after save
    try {
      await fetch(`/api/posts/${postId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content: typeof content === 'string' ? content : JSON.stringify(content),
          content_html: contentHtml,
          excerpt,
          meta_description: metaDescription,
          tags,
          change_type: finalStatus === 'published' ? 'publish' : 'manual_save',
        }),
      })
    } catch (err) {
      console.error('Version creation error:', err)
    }

    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm('この記事を削除しますか？')) return

    const db = createDataClient()
    await db.from('blog_posts').delete().eq('id', postId)
    router.push('/dashboard/posts')
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

  const handleFieldAssist = async (fieldName: string) => {
    if (!contentHtml && !title) { alert('タイトルか本文を入力してください'); return }
    setFieldAssisting(fieldName)
    try {
      const res = await fetch('/api/ai/field-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field_name: fieldName, title, content: contentHtml }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'AI生成に失敗しました')
        setFieldAssisting(null)
        return
      }
      const data = await res.json()
      if (fieldName === 'excerpt') setExcerpt(data.generated_value)
      else if (fieldName === 'meta_description') setMetaDescription(data.generated_value)
      else if (fieldName === 'tags') setTags(prev => [...new Set([...prev, ...data.generated_value])])
    } catch (err) {
      console.error('Field assist error:', err)
      alert('AI生成に失敗しました')
    }
    setFieldAssisting(null)
  }

  const handleRollback = (updatedPost: any) => {
    setTitle(updatedPost.title)
    setContent(updatedPost.content || '')
    setContentHtml(updatedPost.content_html || '')
    setExcerpt(updatedPost.excerpt || '')
    setMetaDescription(updatedPost.meta_description || '')
    setPost(updatedPost)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/posts" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">記事を編集</h1>
        </div>
        <div className="flex items-center gap-3">
          {seoScore > 0 && (
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${
              seoScore >= 80 ? 'bg-green-100 text-green-700' :
              seoScore >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
            }`}>
              SEO: {seoScore}
            </span>
          )}
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            削除
          </button>
          {status !== 'published' && (
            <button
              onClick={() => handleSave('draft')}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
            >
              <Save className="h-4 w-4" />
              保存
            </button>
          )}
          {status === 'published' ? (
            <>
              <button
                onClick={() => handleSave('published')}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                更新
              </button>
              <button
                onClick={() => { if (confirm('この記事を非公開にしますか？')) handleSave('draft') }}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg border border-orange-300 px-4 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50 disabled:opacity-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20"
              >
                <EyeOff className="h-4 w-4" />
                非公開にする
              </button>
            </>
          ) : (
            <button
              onClick={() => handleSave('published')}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Eye className="h-4 w-4" />
              公開
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border-0 bg-transparent text-3xl font-bold text-gray-900 placeholder-gray-300 focus:outline-none dark:text-white"
            placeholder="記事タイトル"
          />

          {aiLoading && (
            <div className="flex items-center gap-2 rounded-lg bg-purple-50 px-4 py-3 text-sm text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
              <Sparkles className="h-4 w-4 animate-spin" />
              AIが処理中...
            </div>
          )}

          <RichTextEditor
            content={contentHtml}
            onChange={(c, html) => { setContent(c); setContentHtml(html) }}
            onAIRewrite={handleAIRewrite}
          />
        </div>

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

            <OptionItem
              label="抄録"
              tooltip="記事一覧やSNSシェア時に表示される要約文。空欄なら本文から自動生成されます"
              action={
                <button
                  onClick={() => handleFieldAssist('excerpt')}
                  disabled={fieldAssisting === 'excerpt' || !contentHtml}
                  className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 disabled:opacity-50"
                >
                  <Sparkles className={`h-3 w-3 ${fieldAssisting === 'excerpt' ? 'animate-spin' : ''}`} />
                  AI生成
                </button>
              }
            >
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                maxLength={300}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="記事の要約"
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
              {coverImageUrl && <img src={coverImageUrl} alt="Cover" className="mt-2 rounded-lg" />}
              <button
                onClick={async () => {
                  setAiLoading(true)
                  try {
                    const res = await fetch('/api/ai/generate-image', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ title, content: contentHtml, postId }),
                    })
                    const data = await res.json()
                    if (data.imageUrl) setCoverImageUrl(data.imageUrl)
                    else alert(data.error || '画像生成に失敗しました')
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

            <OptionItem
              label="meta description"
              tooltip="Google検索結果に表示される説明文（最大160文字）。SEOに直結する重要項目です"
              action={
                <button
                  onClick={() => handleFieldAssist('meta_description')}
                  disabled={fieldAssisting === 'meta_description' || !contentHtml}
                  className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 disabled:opacity-50"
                >
                  <Sparkles className={`h-3 w-3 ${fieldAssisting === 'meta_description' ? 'animate-spin' : ''}`} />
                  AI生成
                </button>
              }
            >
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
              tooltip="記事の分類用タグ。読者がタグで記事を絞り込めます"
              action={
                <button
                  onClick={() => handleFieldAssist('tags')}
                  disabled={fieldAssisting === 'tags' || !contentHtml}
                  className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 disabled:opacity-50"
                >
                  <Sparkles className={`h-3 w-3 ${fieldAssisting === 'tags' ? 'animate-spin' : ''}`} />
                  AI提案
                </button>
              }
            >
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {tag}
                    <button onClick={() => setTags(tags.filter(t => t !== tag))} className="text-gray-400 hover:text-gray-600">&times;</button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && tagInput.trim()) {
                    e.preventDefault()
                    if (!tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()])
                    setTagInput('')
                  }
                }}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="タグを入力してEnter"
              />
            </OptionItem>
          </OptionsPanel>

          <div className="mt-3">
            <TranslationPanel postId={postId} slug={slug} />
          </div>

          <div className="mt-3">
            <VersionHistory postId={postId} onRollback={handleRollback} />
          </div>
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
