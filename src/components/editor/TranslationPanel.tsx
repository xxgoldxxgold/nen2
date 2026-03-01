'use client'

import { useState, useEffect, useCallback } from 'react'
import { Globe, Loader2, Check, AlertTriangle, ChevronDown, Trash2, ExternalLink } from 'lucide-react'

const LANGUAGES: Record<string, { label: string; flag: string }> = {
  en: { label: 'English', flag: '🇺🇸' },
  zh: { label: '中文（簡体）', flag: '🇨🇳' },
  'zh-tw': { label: '中文（繁體）', flag: '🇹🇼' },
  ko: { label: '한국어', flag: '🇰🇷' },
  es: { label: 'Español', flag: '🇪🇸' },
  fr: { label: 'Français', flag: '🇫🇷' },
  de: { label: 'Deutsch', flag: '🇩🇪' },
  pt: { label: 'Português', flag: '🇧🇷' },
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: '下書き', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  published: { label: '公開中', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  needs_update: { label: '更新必要', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
}

type Translation = {
  id: string
  language_code: string
  title: string
  status: string
  updated_at: string
}

type TranslationDetail = Translation & {
  content_html: string | null
  excerpt: string | null
  meta_description: string | null
}

interface TranslationPanelProps {
  postId: string
  username?: string
  slug?: string
}

export default function TranslationPanel({ postId, username, slug }: TranslationPanelProps) {
  const [open, setOpen] = useState(false)
  const [translations, setTranslations] = useState<Translation[]>([])
  const [translating, setTranslating] = useState(false)
  const [selectedLangs, setSelectedLangs] = useState<string[]>([])
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [editingLang, setEditingLang] = useState<string | null>(null)
  const [editData, setEditData] = useState<TranslationDetail | null>(null)
  const [saving, setSaving] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const loadTranslations = useCallback(async () => {
    const res = await fetch(`/api/posts/${postId}/translations`)
    if (res.ok) {
      const data = await res.json()
      setTranslations(data.translations || [])
    }
  }, [postId])

  useEffect(() => {
    if (open) loadTranslations()
  }, [open, loadTranslations])

  const handleTranslate = async () => {
    if (selectedLangs.length === 0) return
    setTranslating(true)
    try {
      const res = await fetch(`/api/posts/${postId}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ languages: selectedLangs }),
      })
      if (res.ok) {
        setSelectedLangs([])
        setShowLangPicker(false)
        await loadTranslations()
      } else {
        const err = await res.json()
        alert(err.error || '翻訳に失敗しました')
      }
    } catch {
      alert('翻訳に失敗しました')
    }
    setTranslating(false)
  }

  const openEditor = async (lang: string) => {
    setLoadingDetail(true)
    setEditingLang(lang)
    const res = await fetch(`/api/posts/${postId}/translations/${lang}`)
    if (res.ok) {
      setEditData(await res.json())
    }
    setLoadingDetail(false)
  }

  const saveTranslation = async () => {
    if (!editData || !editingLang) return
    setSaving(true)
    await fetch(`/api/posts/${postId}/translations/${editingLang}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editData.title,
        content_html: editData.content_html,
        excerpt: editData.excerpt,
        meta_description: editData.meta_description,
      }),
    })
    setSaving(false)
    await loadTranslations()
  }

  const publishTranslation = async (lang: string) => {
    await fetch(`/api/posts/${postId}/translations/${lang}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'published' }),
    })
    await loadTranslations()
    if (editData && editingLang === lang) {
      setEditData({ ...editData, status: 'published' })
    }
  }

  const unpublishTranslation = async (lang: string) => {
    await fetch(`/api/posts/${postId}/translations/${lang}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'draft' }),
    })
    await loadTranslations()
    if (editData && editingLang === lang) {
      setEditData({ ...editData, status: 'draft' })
    }
  }

  const deleteTranslation = async (lang: string) => {
    if (!confirm(`${LANGUAGES[lang]?.label || lang}の翻訳を削除しますか？`)) return
    await fetch(`/api/posts/${postId}/translations/${lang}`, { method: 'DELETE' })
    if (editingLang === lang) {
      setEditingLang(null)
      setEditData(null)
    }
    await loadTranslations()
  }

  const existingLangs = new Set(translations.map(t => t.language_code))
  const availableLangs = Object.entries(LANGUAGES).filter(([code]) => !existingLangs.has(code))

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          <Globe className="h-4 w-4" />
          翻訳 {translations.length > 0 && `(${translations.length})`}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-gray-200 px-4 pb-4 pt-3 dark:border-gray-700">
          {/* Editing view */}
          {editingLang && editData ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {LANGUAGES[editingLang]?.flag} {LANGUAGES[editingLang]?.label}
                </span>
                <button
                  onClick={() => { setEditingLang(null); setEditData(null) }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  ← 戻る
                </button>
              </div>

              {loadingDetail ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : (
                <>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">タイトル</label>
                    <input
                      value={editData.title}
                      onChange={e => setEditData({ ...editData, title: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">抜粋</label>
                    <textarea
                      value={editData.excerpt || ''}
                      onChange={e => setEditData({ ...editData, excerpt: e.target.value })}
                      rows={2}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">メタディスクリプション</label>
                    <textarea
                      value={editData.meta_description || ''}
                      onChange={e => setEditData({ ...editData, meta_description: e.target.value })}
                      rows={2}
                      maxLength={160}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">本文HTML</label>
                    <textarea
                      value={editData.content_html || ''}
                      onChange={e => setEditData({ ...editData, content_html: e.target.value })}
                      rows={8}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={saveTranslation}
                      disabled={saving}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? '保存中...' : '保存'}
                    </button>
                    {editData.status !== 'published' ? (
                      <button
                        onClick={() => publishTranslation(editingLang)}
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                      >
                        公開
                      </button>
                    ) : (
                      <button
                        onClick={() => unpublishTranslation(editingLang)}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400"
                      >
                        非公開にする
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Translation list */}
              {translations.length > 0 && (
                <div className="mb-3 space-y-2">
                  {translations.map(t => {
                    const lang = LANGUAGES[t.language_code]
                    const st = STATUS_LABELS[t.status] || STATUS_LABELS.draft
                    return (
                      <div key={t.language_code} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800">
                        <button
                          onClick={() => openEditor(t.language_code)}
                          className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 dark:text-gray-300"
                        >
                          <span>{lang?.flag}</span>
                          <span>{lang?.label || t.language_code}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${st.color}`}>
                            {st.label}
                          </span>
                          {t.status === 'needs_update' && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                        </button>
                        <div className="flex items-center gap-1">
                          {t.status === 'published' && username && slug && (
                            <a
                              href={`/${username}/${slug}?lang=${t.language_code}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded p-1 text-gray-400 hover:text-blue-500"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => deleteTranslation(t.language_code)}
                            className="rounded p-1 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Add translation */}
              {showLangPicker ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-1.5">
                    {availableLangs.map(([code, { label, flag }]) => (
                      <label
                        key={code}
                        className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs ${
                          selectedLangs.includes(code)
                            ? 'border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedLangs.includes(code)}
                          onChange={e => {
                            setSelectedLangs(prev =>
                              e.target.checked ? [...prev, code] : prev.filter(l => l !== code)
                            )
                          }}
                          className="sr-only"
                        />
                        <span>{flag}</span>
                        <span className="text-gray-700 dark:text-gray-300">{label}</span>
                        {selectedLangs.includes(code) && <Check className="ml-auto h-3 w-3 text-blue-600" />}
                      </label>
                    ))}
                  </div>
                  {availableLangs.length === 0 && (
                    <p className="text-center text-xs text-gray-400">全言語の翻訳が存在します</p>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTranslate}
                      disabled={translating || selectedLangs.length === 0}
                      className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {translating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Globe className="h-3 w-3" />}
                      {translating ? '翻訳中...' : `${selectedLangs.length}言語を翻訳`}
                    </button>
                    <button
                      onClick={() => { setShowLangPicker(false); setSelectedLangs([]) }}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowLangPicker(true)}
                  className="w-full rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600 dark:border-gray-600"
                >
                  + 翻訳を追加
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
