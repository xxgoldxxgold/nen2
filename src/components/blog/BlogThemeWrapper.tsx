import { profileToTheme, generateInlineCSS, generateGoogleFontsUrl } from '@/lib/theme'
import type { ReactNode } from 'react'

interface BlogThemeWrapperProps {
  profile: {
    accent_color: string
    heading_font: string
    body_font: string
    header_image_url: string | null
  }
  children: ReactNode
}

export default function BlogThemeWrapper({ profile, children }: BlogThemeWrapperProps) {
  const theme = profileToTheme(profile)
  const css = generateInlineCSS(theme)
  const fontsUrl = generateGoogleFontsUrl(theme)

  return (
    <>
      {fontsUrl && (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="preload" href={fontsUrl} as="style" />
          <link rel="stylesheet" href={fontsUrl} />
        </>
      )}
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {children}
    </>
  )
}
