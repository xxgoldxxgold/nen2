import { migrateOldSettings } from '@/lib/theme'
import type { BlogTheme } from '@/lib/theme'
import type { ReactNode } from 'react'

interface BlogThemeWrapperProps {
  blogSettings: Record<string, unknown>
  children: ReactNode
}

export default function BlogThemeWrapper({ blogSettings, children }: BlogThemeWrapperProps) {
  const theme = migrateOldSettings(blogSettings)

  return (
    <>
      {theme.font_preload.map((f: string) => (
        <link key={f} rel="preload" href={f} as="font" type="font/woff2" crossOrigin="anonymous" />
      ))}
      <style dangerouslySetInnerHTML={{ __html: theme.css.inline }} />
      {children}
    </>
  )
}

export function getThemeLayout(blogSettings: Record<string, unknown>): BlogTheme['layout'] {
  const theme = migrateOldSettings(blogSettings)
  return theme.layout
}
