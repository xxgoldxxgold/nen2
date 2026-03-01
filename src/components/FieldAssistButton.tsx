'use client'

import { useState } from 'react'
import { Sparkles, Check, RefreshCw, X } from 'lucide-react'

interface Props {
  field: string
  title: string
  content: string
  onApply: (value: string) => void
  contextNotes?: string
}

export default function FieldAssistButton({ field, title, content, onApply, contextNotes }: Props) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/field-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, title, content, context_notes: contextNotes }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'エラー')
        return
      }
      const data = await res.json()
      setPreview(data.result)
    } catch {
      setError('通信エラー')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = () => {
    if (preview) {
      onApply(preview)
      setPreview(null)
    }
  }

  if (preview) {
    return (
      <div className="mt-1 rounded-lg border border-purple-200 bg-purple-50 p-2 dark:border-purple-800 dark:bg-purple-900/20">
        <p className="mb-2 text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{preview}</p>
        <div className="flex gap-1">
          <button onClick={handleApply} className="flex items-center gap-1 rounded bg-purple-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-purple-700">
            <Check className="h-3 w-3" /> 適用
          </button>
          <button onClick={generate} disabled={loading} className="flex items-center gap-1 rounded bg-gray-200 px-2 py-1 text-[10px] font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300">
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> 再生成
          </button>
          <button onClick={() => setPreview(null)} className="flex items-center gap-1 rounded bg-gray-200 px-2 py-1 text-[10px] font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300">
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={generate}
        disabled={loading}
        className="inline-flex items-center gap-0.5 text-[10px] text-purple-600 hover:text-purple-700 disabled:opacity-50 dark:text-purple-400"
        title="AIで生成"
      >
        <Sparkles className={`h-3 w-3 ${loading ? 'animate-pulse' : ''}`} />
        {loading ? '生成中...' : 'AI生成'}
      </button>
      {error && <span className="text-[10px] text-red-500 ml-1">{error}</span>}
    </>
  )
}
