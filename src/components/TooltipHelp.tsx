'use client'

import { useState, useRef, useEffect } from 'react'
import { HelpCircle } from 'lucide-react'

export default function TooltipHelp({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [open])

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <HelpCircle className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-50 w-64 rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-600 shadow-lg dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
          {text}
        </div>
      )}
    </div>
  )
}
