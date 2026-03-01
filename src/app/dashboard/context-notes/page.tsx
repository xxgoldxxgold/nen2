'use client'

import { useState, useEffect } from 'react'
import { BookOpen, Plus, Trash2, Power, PowerOff } from 'lucide-react'

interface ContextNote {
  id: string
  category: string
  title: string
  content: string
  is_active: boolean
  sort_order: number
  created_at: string
}

const categories = [
  { value: 'context', label: 'ブログ方針', color: 'blue' },
  { value: 'style', label: '文体・トーン', color: 'purple' },
  { value: 'audience', label: '読者ターゲット', color: 'green' },
  { value: 'fact', label: '事実・データ', color: 'orange' },
  { value: 'reference', label: '参考情報', color: 'gray' },
]

export default function ContextNotesPage() {
  const [notes, setNotes] = useState<ContextNote[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formCategory, setFormCategory] = useState('context')
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [saving, setSaving] = useState(false)

  const loadNotes = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/context-notes')
      if (res.ok) setNotes(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadNotes() }, [])

  const handleSave = async () => {
    if (!formTitle.trim() || !formContent.trim()) return
    setSaving(true)
    try {
      if (editingId) {
        const res = await fetch(`/api/context-notes/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: formCategory, title: formTitle, content: formContent }),
        })
        if (res.ok) {
          setEditingId(null)
          setShowForm(false)
          loadNotes()
        }
      } else {
        const res = await fetch('/api/context-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: formCategory, title: formTitle, content: formContent }),
        })
        if (res.ok) {
          setShowForm(false)
          loadNotes()
        } else {
          const err = await res.json()
          alert(err.error)
        }
      }
      setFormTitle('')
      setFormContent('')
      setFormCategory('context')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (note: ContextNote) => {
    await fetch(`/api/context-notes/${note.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !note.is_active }),
    })
    loadNotes()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('このノートを削除しますか？')) return
    await fetch(`/api/context-notes/${id}`, { method: 'DELETE' })
    loadNotes()
  }

  const handleEdit = (note: ContextNote) => {
    setEditingId(note.id)
    setFormCategory(note.category)
    setFormTitle(note.title)
    setFormContent(note.content)
    setShowForm(true)
  }

  const getCategoryInfo = (cat: string) => categories.find(c => c.value === cat) || categories[0]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  // Group by category
  const grouped: Record<string, ContextNote[]> = {}
  for (const cat of categories) grouped[cat.value] = []
  for (const note of notes) {
    if (!grouped[note.category]) grouped[note.category] = []
    grouped[note.category].push(note)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
          <BookOpen className="h-6 w-6" />
          コンテキストノート
        </h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setFormTitle(''); setFormContent('') }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          新規追加
        </button>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        AI生成時に自動で参照されるコンテキスト情報です。ブログの方針や文体、読者情報を設定しておくと、より適切な文章が生成されます。
      </p>

      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            {editingId ? 'ノート編集' : '新規ノート'}
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500">カテゴリ</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setFormCategory(cat.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      formCategory === cat.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500">タイトル</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="例: ブログの基本方針"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">内容</label>
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="例: テクノロジーとビジネスの交差点に焦点を当て、実用的な情報を提供する"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving || !formTitle.trim() || !formContent.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? '保存中...' : editingId ? '更新' : '追加'}
              </button>
              <button
                onClick={() => { setShowForm(false); setEditingId(null) }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {notes.length === 0 && !showForm && (
        <div className="py-12 text-center text-sm text-gray-400">
          <BookOpen className="mx-auto mb-2 h-10 w-10" />
          コンテキストノートがありません。<br />
          「新規追加」からブログの方針や文体を設定しましょう。
        </div>
      )}

      {categories.map(cat => {
        const catNotes = grouped[cat.value]
        if (!catNotes || catNotes.length === 0) return null
        return (
          <div key={cat.value}>
            <h2 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{cat.label}</h2>
            <div className="space-y-2">
              {catNotes.map(note => (
                <div
                  key={note.id}
                  className={`rounded-lg border p-3 ${
                    note.is_active
                      ? 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
                      : 'border-gray-100 bg-gray-50 opacity-60 dark:border-gray-800 dark:bg-gray-950'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{note.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{note.content}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => handleToggle(note)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                        title={note.is_active ? '無効にする' : '有効にする'}
                      >
                        {note.is_active ? <Power className="h-3.5 w-3.5 text-green-500" /> : <PowerOff className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => handleEdit(note)}
                        className="rounded p-1 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
