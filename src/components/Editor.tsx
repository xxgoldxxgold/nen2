'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered,
  Quote, Code, Link2, ImageIcon, Minus, Sparkles, Wand2, MessageSquare
} from 'lucide-react'

type EditorProps = {
  value: string
  onChange: (value: string) => void
  onImageUpload?: (file: File) => Promise<string>
  title?: string
}

type AIAction = 'generate' | 'rewrite' | 'suggest' | 'suggest-tags'

export default function Editor({ value, onChange, onImageUpload, title }: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [aiLoading, setAiLoading] = useState<AIAction | null>(null)
  const [aiStatus, setAiStatus] = useState<string | null>(null)
  const [showAiMenu, setShowAiMenu] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const insertAtCursor = useCallback((before: string, after = '') => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = value.slice(start, end)
    const newText = value.slice(0, start) + before + selected + after + value.slice(end)
    onChange(newText)
    requestAnimationFrame(() => {
      ta.focus()
      const cursor = start + before.length + selected.length + after.length
      ta.setSelectionRange(cursor, cursor)
    })
  }, [value, onChange])

  const wrapSelection = useCallback((wrapper: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = value.slice(start, end) || 'テキスト'
    const newText = value.slice(0, start) + wrapper + selected + wrapper + value.slice(end)
    onChange(newText)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(start + wrapper.length, start + wrapper.length + selected.length)
    })
  }, [value, onChange])

  const insertLinePrefix = useCallback((prefix: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const newText = value.slice(0, lineStart) + prefix + value.slice(lineStart)
    onChange(newText)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(start + prefix.length, start + prefix.length)
    })
  }, [value, onChange])

  const handleImageUpload = useCallback(async (file: File) => {
    if (!onImageUpload) return
    try {
      const url = await onImageUpload(file)
      insertAtCursor(`\n![${file.name}](${url})\n`)
    } catch {
      // silently fail
    }
  }, [onImageUpload, insertAtCursor])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file)
    }
  }, [handleImageUpload])

  const handleImageClick = useCallback(() => {
    if (onImageUpload) {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) handleImageUpload(file)
      }
      input.click()
    } else {
      const url = prompt('画像URLを入力:')
      if (url) insertAtCursor(`\n![画像](${url})\n`)
    }
  }, [onImageUpload, handleImageUpload, insertAtCursor])

  const handleLinkClick = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = value.slice(start, end) || 'リンクテキスト'
    const url = prompt('URLを入力:')
    if (url) {
      const newText = value.slice(0, start) + `[${selected}](${url})` + value.slice(end)
      onChange(newText)
    }
  }, [value, onChange])

  // AI features
  const handleAI = useCallback(async (action: AIAction) => {
    setAiLoading(action)
    setShowAiMenu(false)
    try {
      if (action === 'generate') {
        setAiStatus('接続中...')
        const res = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: title || '無題' }),
        })
        if (!res.ok) throw new Error()
        const reader = res.body?.getReader()
        if (!reader) return
        const decoder = new TextDecoder()
        let result = value
        while (true) {
          const { done, value: chunk } = await reader.read()
          if (done) break
          // Status messages start with 0x00 byte
          if (chunk[0] === 0x00) {
            setAiStatus(decoder.decode(chunk.slice(1)))
          } else {
            setAiStatus('記事を作成中...')
            result += decoder.decode(chunk)
            onChange(result)
          }
        }
        setAiStatus(null)
      } else if (action === 'rewrite') {
        const ta = textareaRef.current
        if (!ta) return
        const start = ta.selectionStart
        const end = ta.selectionEnd
        const selected = value.slice(start, end)
        if (!selected) { alert('リライトするテキストを選択してください'); return }
        const res = await fetch('/api/ai/rewrite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: selected, style: 'improve' }),
        })
        if (!res.ok) throw new Error()
        const data = await res.json()
        if (data.rewritten) {
          const newText = value.slice(0, start) + data.rewritten + value.slice(end)
          onChange(newText)
        }
      } else if (action === 'suggest') {
        const ta = textareaRef.current
        const context = ta ? value.slice(Math.max(0, ta.selectionStart - 500), ta.selectionStart) : value.slice(-500)
        const res = await fetch('/api/ai/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context, title }),
        })
        if (!res.ok) throw new Error()
        const data = await res.json()
        if (data.suggestion) {
          insertAtCursor(data.suggestion)
        }
      }
    } catch {
      // silently fail
    } finally {
      setAiLoading(null)
      setAiStatus(null)
    }
  }, [value, onChange, title, insertAtCursor])

  const toolbar = [
    { icon: Bold, label: '太字', action: () => wrapSelection('**') },
    { icon: Italic, label: '斜体', action: () => wrapSelection('*') },
    { icon: Heading2, label: '見出し2', action: () => insertLinePrefix('## ') },
    { icon: Heading3, label: '見出し3', action: () => insertLinePrefix('### ') },
    'sep',
    { icon: List, label: '箇条書き', action: () => insertLinePrefix('- ') },
    { icon: ListOrdered, label: '番号付き', action: () => insertLinePrefix('1. ') },
    { icon: Quote, label: '引用', action: () => insertLinePrefix('> ') },
    { icon: Code, label: 'コード', action: () => insertAtCursor('```\n', '\n```') },
    'sep',
    { icon: Link2, label: 'リンク', action: handleLinkClick },
    { icon: ImageIcon, label: '画像', action: handleImageClick },
    { icon: Minus, label: '区切り線', action: () => insertAtCursor('\n---\n') },
  ]

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        {toolbar.map((item, i) =>
          item === 'sep' ? (
            <div key={i} className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700" />
          ) : (
            <button
              key={i}
              type="button"
              onClick={(item as any).action}
              title={(item as any).label}
              className="rounded p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              {(() => { const Icon = (item as any).icon; return <Icon className="h-4 w-4" /> })()}
            </button>
          )
        )}

        <div className="ml-auto relative">
          <button
            type="button"
            onClick={() => setShowAiMenu(!showAiMenu)}
            disabled={!!aiLoading}
            className="flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/30"
          >
            <Sparkles className="h-4 w-4" />
            {aiStatus || (aiLoading ? 'AI処理中...' : 'AI')}
          </button>
          {showAiMenu && (
            <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
              <button
                type="button"
                onClick={() => handleAI('generate')}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Sparkles className="h-4 w-4 text-purple-500" />
                AI記事生成
              </button>
              <button
                type="button"
                onClick={() => handleAI('rewrite')}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Wand2 className="h-4 w-4 text-blue-500" />
                選択テキストをリライト
              </button>
              <button
                type="button"
                onClick={() => handleAI('suggest')}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <MessageSquare className="h-4 w-4 text-green-500" />
                続きを提案
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI Status Banner */}
      {aiStatus && (
        <div className="flex items-center gap-3 border-b border-purple-200 bg-purple-50 px-4 py-3 dark:border-purple-800 dark:bg-purple-900/20">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-300 border-t-purple-600" />
          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">{aiStatus}</span>
        </div>
      )}

      {/* Textarea */}
      <div
        className={`relative ${dragOver ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[500px] w-full resize-y bg-transparent px-6 py-4 font-mono text-sm leading-relaxed text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white"
          placeholder="Markdownで記事を書く...

## 見出し
本文テキスト

- 箇条書き
- **太字**、*斜体*

> 引用ブロック"
        />
        {dragOver && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-lg bg-blue-100 px-6 py-4 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              <ImageIcon className="mx-auto h-8 w-8 mb-2" />
              画像をドロップしてアップロード
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
