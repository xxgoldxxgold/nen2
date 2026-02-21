'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function CopyUrlButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-green-500" />
          コピー済み
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          URLをコピー
        </>
      )}
    </button>
  )
}
