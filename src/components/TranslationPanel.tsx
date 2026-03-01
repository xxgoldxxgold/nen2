'use client'

import { useState, useEffect } from 'react'
import { Languages, Play, Eye, ChevronDown, ChevronUp, Save } from 'lucide-react'

interface Translation {
  id: string
  language_code: string
  title: string
  content?: string
  meta_description?: string
  status: string
  created_at: string
  updated_at: string
}

const languages = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文(简体)' },
  { code: 'zh-tw', label: '中文(繁體)' },
  { code: 'ko', label: '韓国語' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
]

export default function TranslationPanel({ postId }: { postId: string }) {
  const [translations, setTranslations] = useState<Translation[]>([])
  const [expanded, setExpanded] = useState(false)
  const [selectedLang, setSelectedLang] = useState<string | null>(null)
  const [translating, setTranslating] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)

  const loadTranslations = async () => {
    const res = await fetch(`/api/posts/${postId}/translations`)
    if (res.ok) setTranslations(await res.json())
  }

  useEffect(() => { loadTranslations() }, [postId])

  const handleTranslate = async (langCode: string) => {
    setTranslating(true)
    setStreamText('')
    setSelectedLang(langCode)
    try {
      const res = await fetch(`/api/posts/${postId}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: langCode }),
      })

      if (!res.ok) {
        const err = await res.json()
        alert(err.error || '翻訳に失敗しました')
        return
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let text = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          text += decoder.decode(value, { stream: true })
          setStreamText(text)
        }
      }

      // Parse for edit
      let title = ''
      let content = text
      const titleMatch = text.match(/^## (.+)/m)
      if (titleMatch) {
        title = titleMatch[1].trim()
        content = text.replace(/^## .+\n?/, '').replace(/<!--\s*meta:\s*.+?\s*-->\n?/, '').trim()
      }
      setEditTitle(title)
      setEditContent(content)

      loadTranslations()
    } finally {
      setTranslating(false)
    }
  }

  const handleLoadTranslation = async (langCode: string) => {
    setSelectedLang(langCode)
    const res = await fetch(`/api/posts/${postId}/translations/${langCode}`)
    if (res.ok) {
      const data = await res.json()
      setEditTitle(data.title)
      setEditContent(data.content)
      setStreamText('')
    }
  }

  const handleSave = async () => {
    if (!selectedLang) return
    setSaving(true)
    try {
      await fetch(`/api/posts/${postId}/translations/${selectedLang}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, content: editContent }),
      })
      loadTranslations()
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async (langCode: string, publish: boolean) => {
    await fetch(`/api/posts/${postId}/translations/${langCode}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: publish ? 'published' : 'draft' }),
    })
    loadTranslations()
  }

  const existingLangs = new Set(translations.map(t => t.language_code))

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-4 py-3 text-sm text-left"
      >
        <Languages className="h-4 w-4 text-gray-500" />
        <span className="flex-1 font-medium text-gray-700 dark:text-gray-300">
          翻訳
          {translations.length > 0 && (
            <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">({translations.length}言語)</span>
          )}
        </span>
        {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {expanded && (
        <div className="border-t border-gray-200 p-4 dark:border-gray-700">
          {/* Language list */}
          <div className="mb-3 flex flex-wrap gap-2">
            {languages.map(lang => {
              const existing = translations.find(t => t.language_code === lang.code)
              return (
                <div key={lang.code} className="flex items-center gap-1">
                  <button
                    onClick={() => existing ? handleLoadTranslation(lang.code) : handleTranslate(lang.code)}
                    disabled={translating}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      selectedLang === lang.code
                        ? 'bg-blue-600 text-white'
                        : existing
                        ? 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                    } disabled:opacity-50`}
                  >
                    {lang.label}
                    {existing && (
                      <span className="ml-1 text-[9px]">
                        {existing.status === 'published' ? '✓' : '下書き'}
                      </span>
                    )}
                  </button>
                  {!existing && (
                    <button
                      onClick={() => handleTranslate(lang.code)}
                      disabled={translating}
                      className="rounded p-0.5 text-gray-400 hover:text-blue-600 disabled:opacity-50"
                      title="翻訳する"
                    >
                      <Play className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Streaming / editing area */}
          {translating && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
              <p className="mb-2 text-xs text-blue-600 dark:text-blue-400">翻訳中...</p>
              <div className="max-h-60 overflow-auto whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-300">
                {streamText}
              </div>
            </div>
          )}

          {!translating && selectedLang && editContent && (
            <div className="space-y-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="翻訳タイトル"
              />
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={8}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-mono dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="h-3 w-3" />
                  {saving ? '保存中...' : '保存'}
                </button>
                {existingLangs.has(selectedLang) && (
                  <>
                    {translations.find(t => t.language_code === selectedLang)?.status !== 'published' ? (
                      <button
                        onClick={() => handlePublish(selectedLang, true)}
                        className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                      >
                        <Eye className="h-3 w-3" /> 公開
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePublish(selectedLang, false)}
                        className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400"
                      >
                        非公開に戻す
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={() => handleTranslate(selectedLang)}
                  className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400"
                >
                  再翻訳
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
