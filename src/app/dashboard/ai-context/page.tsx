'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, ChevronDown, Power, Sparkles } from 'lucide-react'
import type { ContextNote, ContextNoteCategory } from '@/lib/types'

const CATEGORIES: { value: ContextNoteCategory; label: string; description: string }[] = [
  { value: 'context', label: 'ブログの方針', description: 'ブログの方向性・目的' },
  { value: 'style', label: '文体・トーン', description: '文章スタイルの指定' },
  { value: 'audience', label: 'ターゲット読者', description: '想定読者層の情報' },
  { value: 'fact', label: '事実情報', description: '固有名詞・製品名等' },
  { value: 'reference', label: '参考情報', description: '参考URL・資料' },
]

export default function AIContextPage() {
  const [notes, setNotes] = useState<ContextNote[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formCategory, setFormCategory] = useState<ContextNoteCategory>('context')
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch('/api/context-notes')
      if (res.ok) setNotes(await res.json())
    } catch (err) {
      console.error('Failed to fetch notes:', err)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchNotes() }, [fetchNotes])

  const handleCreate = async () => {
    if (!formTitle.trim() || !formContent.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/context-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: formCategory, title: formTitle, content: formContent }),
      })
      if (res.ok) {
        setCreating(false)
        setFormTitle('')
        setFormContent('')
        await fetchNotes()
      }
    } catch (err) {
      console.error('Create error:', err)
    }
    setSaving(false)
  }

  const handleUpdate = async (id: string, updates: Partial<ContextNote>) => {
    try {
      const res = await fetch(`/api/context-notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (res.ok) await fetchNotes()
    } catch (err) {
      console.error('Update error:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('このノートを削除しますか？')) return
    try {
      const res = await fetch(`/api/context-notes/${id}`, { method: 'DELETE' })
      if (res.ok) await fetchNotes()
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const handleSaveEdit = async (note: ContextNote) => {
    setSaving(true)
    await handleUpdate(note.id, { title: formTitle, content: formContent, category: formCategory })
    setEditing(null)
    setSaving(false)
  }

  const startEdit = (note: ContextNote) => {
    setEditing(note.id)
    setFormTitle(note.title)
    setFormContent(note.content)
    setFormCategory(note.category)
  }

  const grouped = CATEGORIES.map(cat => ({
    ...cat,
    notes: notes.filter(n => n.category === cat.value),
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
            <Sparkles className="h-6 w-6 text-purple-600" />
            AIコンテキストノート
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            AIが記事生成・リライト時に参照する情報を設定できます
          </p>
        </div>
        <button
          onClick={() => { setCreating(true); setFormTitle(''); setFormContent(''); setFormCategory('context') }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          ノート追加
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">新規ノート</h3>
          <NoteForm
            category={formCategory}
            title={formTitle}
            content={formContent}
            onCategoryChange={setFormCategory}
            onTitleChange={setFormTitle}
            onContentChange={setFormContent}
            onSave={handleCreate}
            onCancel={() => setCreating(false)}
            saving={saving}
          />
        </div>
      )}

      {/* Notes by category */}
      {grouped.map(cat => (
        <CategorySection key={cat.value} label={cat.label} description={cat.description} count={cat.notes.length}>
          {cat.notes.length === 0 ? (
            <p className="py-3 text-center text-xs text-gray-400">ノートがありません</p>
          ) : (
            <div className="space-y-2">
              {cat.notes.map(note => (
                <div key={note.id} className="rounded-lg border border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                  {editing === note.id ? (
                    <NoteForm
                      category={formCategory}
                      title={formTitle}
                      content={formContent}
                      onCategoryChange={setFormCategory}
                      onTitleChange={setFormTitle}
                      onContentChange={setFormContent}
                      onSave={() => handleSaveEdit(note)}
                      onCancel={() => setEditing(null)}
                      saving={saving}
                    />
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 cursor-pointer" onClick={() => startEdit(note)}>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{note.title}</span>
                          {!note.is_active && (
                            <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-400 dark:bg-gray-800">OFF</span>
                          )}
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{note.content}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => handleUpdate(note.id, { is_active: !note.is_active })}
                          className={`rounded-lg p-1.5 transition-colors ${
                            note.is_active
                              ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                              : 'text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                          title={note.is_active ? 'ON（クリックで無効化）' : 'OFF（クリックで有効化）'}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(note.id)}
                          className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CategorySection>
      ))}

      {notes.length === 0 && !creating && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center dark:border-gray-700">
          <Sparkles className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            ノートを追加すると、AIが記事を生成する際に自動的に参照します
          </p>
          <button
            onClick={() => { setCreating(true); setFormTitle(''); setFormContent(''); setFormCategory('style') }}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400"
          >
            <Plus className="h-4 w-4" />
            最初のノートを追加
          </button>
        </div>
      )}
    </div>
  )
}

function CategorySection({
  label, description, count, children,
}: {
  label: string; description: string; count: number; children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/50">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</span>
          <span className="text-xs text-gray-400">{description}</span>
          {count > 0 && (
            <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {count}
            </span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

function NoteForm({
  category, title, content,
  onCategoryChange, onTitleChange, onContentChange,
  onSave, onCancel, saving,
}: {
  category: ContextNoteCategory
  title: string
  content: string
  onCategoryChange: (c: ContextNoteCategory) => void
  onTitleChange: (t: string) => void
  onContentChange: (c: string) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  return (
    <div className="space-y-3">
      <select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value as ContextNoteCategory)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      >
        {CATEGORIES.map(c => (
          <option key={c.value} value={c.value}>{c.label} — {c.description}</option>
        ))}
      </select>
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="ノートのタイトル"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      />
      <textarea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder="AIに伝えたい情報を入力..."
        rows={4}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400"
        >
          キャンセル
        </button>
        <button
          onClick={onSave}
          disabled={saving || !title.trim() || !content.trim()}
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  )
}
