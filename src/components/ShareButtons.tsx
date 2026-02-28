'use client'

import { useState } from 'react'

interface ShareButtonsProps {
  url: string
  title: string
}

export default function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="share-buttons">
      <a
        href={`https://x.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="share-btn"
        style={{ background: '#000' }}
      >
        X
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="share-btn"
        style={{ background: '#1877F2' }}
      >
        Facebook
      </a>
      <button
        onClick={handleCopy}
        className="share-btn"
        style={{ background: '#555', cursor: 'pointer', border: 'none' }}
      >
        {copied ? 'コピー済み' : 'リンクをコピー'}
      </button>
    </div>
  )
}
