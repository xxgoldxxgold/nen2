'use client'

import { useState, useEffect } from 'react'
import { BookOpen, ChevronDown, ChevronUp, Power, PowerOff } from 'lucide-react'

interface ContextNote {
  id: string
  category: string
  title: string
  content: string
  is_active: boolean
}

const categoryLabels: Record<string, string> = {
  context: 'ブログ方針',
  style: '文体',
  audience: '読者',
  fact: '事実',
  reference: '参考',
}

export default function ContextNotesPanel({
  onContextChange,
}: {
  onContextChange?: (contextPrompt: string) => void
}) {
  const [notes, setNotes] = useState<ContextNote[]>([])
  const [expanded, setExpanded] = useState(false)
  const [localOverrides, setLocalOverrides] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch('/api/context-notes')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setNotes(data)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!onContextChange) return
    const activeNotes = notes.filter(n => {
      const override = localOverrides[n.id]
      return override !== undefined ? override : n.is_active
    })

    if (activeNotes.length === 0) {
      onContextChange('')
      return
    }

    const grouped: Record<string, string[]> = {}
    for (const note of activeNotes) {
      const label = categoryLabels[note.category] || note.category
      if (!grouped[label]) grouped[label] = []
      grouped[label].push(`- ${note.title}: ${note.content}`)
    }

    const prompt = Object.entries(grouped)
      .map(([label, items]) => `【${label}】\n${items.join('\n')}`)
      .join('\n\n')

    onContextChange(`\n## ユーザーのコンテキスト情報\n${prompt}`)
  }, [notes, localOverrides, onContextChange])

  const toggleLocal = (id: string) => {
    setLocalOverrides(prev => {
      const current = prev[id] !== undefined ? prev[id] : notes.find(n => n.id === id)?.is_active ?? true
      return { ...prev, [id]: !current }
    })
  }

  const isNoteActive = (note: ContextNote) => {
    return localOverrides[note.id] !== undefined ? localOverrides[note.id] : note.is_active
  }

  const activeCount = notes.filter(n => isNoteActive(n)).length

  if (notes.length === 0) return null

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-4 py-3 text-sm text-left"
      >
        <BookOpen className="h-4 w-4 text-gray-500" />
        <span className="flex-1 font-medium text-gray-700 dark:text-gray-300">
          コンテキスト
          {activeCount > 0 && (
            <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">({activeCount}件有効)</span>
          )}
        </span>
        {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {expanded && (
        <div className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">
          <p className="mb-2 text-[10px] text-gray-400">AI生成時に参照されます。一時的にON/OFFできます。</p>
          <div className="space-y-1">
            {notes.map(note => (
              <div
                key={note.id}
                className={`flex items-center gap-2 rounded px-2 py-1 text-xs ${
                  isNoteActive(note) ? '' : 'opacity-40'
                }`}
              >
                <button onClick={() => toggleLocal(note.id)} className="shrink-0">
                  {isNoteActive(note) ? (
                    <Power className="h-3 w-3 text-green-500" />
                  ) : (
                    <PowerOff className="h-3 w-3 text-gray-400" />
                  )}
                </button>
                <span className="rounded bg-gray-100 px-1 py-0.5 text-[9px] text-gray-500 dark:bg-gray-800">
                  {categoryLabels[note.category] || note.category}
                </span>
                <span className="min-w-0 flex-1 truncate text-gray-700 dark:text-gray-300">{note.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
