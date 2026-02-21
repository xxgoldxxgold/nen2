'use client'

import { useState } from 'react'

interface AvatarProps {
  src: string | null | undefined
  name: string
  size?: number
  className?: string
  style?: React.CSSProperties
}

export default function Avatar({ src, name, size = 40, className, style }: AvatarProps) {
  const initial = name?.charAt(0)?.toUpperCase() || '?'
  const [failed, setFailed] = useState(false)

  const fallbackStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    background: 'var(--c-primary, #3b82f6)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: size * 0.45,
    flexShrink: 0,
    ...style,
  }

  if (!src || failed) {
    return (
      <div className={className} style={fallbackStyle}>
        {initial}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt=""
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        objectFit: 'cover',
        flexShrink: 0,
        ...style,
      }}
      onError={() => setFailed(true)}
    />
  )
}
