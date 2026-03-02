// Blog Theme System v3 - Simplified, CSS-inline architecture

export interface BlogTheme {
  theme: {
    name: string
    version: string
    description: string
  }
  colors: {
    primary: string
    background: string
    surface: string
    text: string
    text_secondary: string
    text_muted: string
    border: string
    link: string
    link_hover: string
    code_bg: string
    code_text: string
  }
  typography: {
    font_family: {
      heading: string
      body: string
      code: string
    }
    font_size: {
      base: string
      small: string
      h1: string
      h2: string
      h3: string
    }
    line_height: {
      body: number
      heading: number
    }
  }
  layout: {
    type: 'single_column'
    max_width: string
    header: {
      style: 'centered' | 'left_aligned' | 'minimal'
    }
  }
  components: {
    heading_style: 'underline' | 'left_border' | 'background' | 'simple'
    article_card: {
      style: 'minimal' | 'card' | 'list'
    }
  }
  images?: {
    header_svg?: string
    header_image_url?: string
    header_photo_credit?: {
      photographer: string
      pexels_url: string
    }
    logo_url?: string
    favicon_url?: string
    og_template?: 'standard' | 'bold' | 'split' | 'gradient' | 'minimal' | 'photo_overlay'
  }
  css: {
    inline: string
  }
  font_preload: string[]
  [key: string]: unknown
}

export const DEFAULT_THEME: BlogTheme = {
  theme: {
    name: 'Wabi Sabi',
    version: '1.0',
    description: '落ち着いた渋みと静けさを持つ、和の侘び寂びをイメージしたテーマ',
  },
  colors: {
    primary: '#5c6b4a',
    background: '#f5f2ed',
    surface: '#faf8f5',
    text: '#1f1c18',
    text_secondary: '#4a4438',
    text_muted: '#8b7d6b',
    border: '#d6cfc4',
    link: '#5c6b4a',
    link_hover: '#3d4f30',
    code_bg: '#ede9e2',
    code_text: '#3a3530',
  },
  typography: {
    font_family: {
      heading: "'Noto Serif JP', serif",
      body: "'Noto Sans JP', sans-serif",
      code: "'Source Code Pro', monospace",
    },
    font_size: {
      base: '16px',
      small: '0.875rem',
      h1: '2rem',
      h2: '1.5rem',
      h3: '1.25rem',
    },
    line_height: {
      body: 1.9,
      heading: 1.5,
    },
  },
  layout: {
    type: 'single_column',
    max_width: '720px',
    header: {
      style: 'left_aligned',
    },
  },
  components: {
    heading_style: 'left_border',
    article_card: {
      style: 'minimal',
    },
  },
  images: { og_template: 'standard' },
  css: { inline: '' },
  font_preload: [],
}

// --- Font helpers ---

const FONT_SLUG_MAP: Record<string, string> = {
  'Noto Sans JP': 'noto-sans-jp',
  'Noto Serif JP': 'noto-serif-jp',
  'M PLUS 1p': 'm-plus-1p',
  'M PLUS Rounded 1c': 'm-plus-rounded-1c',
  'Zen Maru Gothic': 'zen-maru-gothic',
  'Kosugi Maru': 'kosugi-maru',
  'Sawarabi Gothic': 'sawarabi-gothic',
  'Sawarabi Mincho': 'sawarabi-mincho',
  'Inter': 'inter',
  'Roboto': 'roboto',
  'Open Sans': 'open-sans',
  'Lato': 'lato',
  'Poppins': 'poppins',
  'Playfair Display': 'playfair-display',
  'Merriweather': 'merriweather',
  'Source Code Pro': 'source-code-pro',
  'Fira Code': 'fira-code',
  'JetBrains Mono': 'jetbrains-mono',
}

function extractFontName(fontFamily: string): string | null {
  const match = fontFamily.match(/['"]([^'"]+)['"]/)
  if (match) return match[1]
  for (const name of Object.keys(FONT_SLUG_MAP)) {
    if (fontFamily.includes(name)) return name
  }
  return null
}

function getFontSlug(fontFamily: string): string | null {
  const name = extractFontName(fontFamily)
  if (!name) return null
  return FONT_SLUG_MAP[name] || null
}

// --- CSS generation ---

export function generateInlineCSS(theme: BlogTheme): string {
  const c = theme.colors
  const ty = theme.typography
  const l = theme.layout
  const comp = theme.components

  let css = ''

  // 1. @font-face
  const bodyName = extractFontName(ty.font_family.body)
  const bodySlug = getFontSlug(ty.font_family.body)
  const headName = extractFontName(ty.font_family.heading)
  const headSlug = getFontSlug(ty.font_family.heading)

  if (bodySlug && bodyName) {
    css += `@font-face{font-family:'${bodyName}';font-weight:400;font-display:swap;src:url(/fonts/${bodySlug}/latin.woff2) format('woff2');unicode-range:U+0000-00FF}`
    css += `@font-face{font-family:'${bodyName}';font-weight:400;font-display:swap;src:url(/fonts/${bodySlug}/japanese.woff2) format('woff2');unicode-range:U+3000-9FFF,U+FF00-FFEF}`
    css += `@font-face{font-family:'${bodyName}';font-weight:700;font-display:swap;src:url(/fonts/${bodySlug}/latin.woff2) format('woff2');unicode-range:U+0000-00FF}`
    css += `@font-face{font-family:'${bodyName}';font-weight:700;font-display:swap;src:url(/fonts/${bodySlug}/japanese.woff2) format('woff2');unicode-range:U+3000-9FFF,U+FF00-FFEF}`
  }
  if (headSlug && headName && headSlug !== bodySlug) {
    css += `@font-face{font-family:'${headName}';font-weight:700;font-display:swap;src:url(/fonts/${headSlug}/latin.woff2) format('woff2');unicode-range:U+0000-00FF}`
    css += `@font-face{font-family:'${headName}';font-weight:700;font-display:swap;src:url(/fonts/${headSlug}/japanese.woff2) format('woff2');unicode-range:U+3000-9FFF,U+FF00-FFEF}`
  }

  // 2. CSS variables
  const effectiveMaxWidth = l.max_width
  css += `:root{--c-primary:${c.primary};--c-bg:${c.background};--c-surface:${c.surface};--c-text:${c.text};--c-text2:${c.text_secondary};--c-text-m:${c.text_muted};--c-border:${c.border};--c-link:${c.link};--c-link-h:${c.link_hover};--c-code-bg:${c.code_bg};--c-code:${c.code_text};--f-head:${ty.font_family.heading};--f-body:${ty.font_family.body};--f-code:${ty.font_family.code};--fs-base:${ty.font_size.base};--fs-sm:${ty.font_size.small};--fs-h1:${ty.font_size.h1};--fs-h2:${ty.font_size.h2};--fs-h3:${ty.font_size.h3};--lh:${ty.line_height.body};--lh-head:${ty.line_height.heading};--mw:${effectiveMaxWidth};--pad:24px}`

  // 3. Base styles
  css += `*,*::before,*::after{box-sizing:border-box}`
  css += `body{font-family:var(--f-body);font-size:var(--fs-base);line-height:var(--lh);color:var(--c-text);background:var(--c-bg);margin:0;-webkit-font-smoothing:antialiased}`
  css += `img{max-width:100%;height:auto;display:block}`
  css += `a{color:var(--c-link);text-decoration:underline}a:hover{color:var(--c-link-h)}`

  // 4. Layout
  css += `.container{max-width:var(--mw);margin:0 auto;padding:0 var(--pad)}`
  // 5. Header
  css += `.header{border-bottom:1px solid var(--c-border)}`
  css += `.header-inner{max-width:var(--mw);margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:1em var(--pad)}`
  if (l.header.style === 'centered') {
    css += `.header-inner{flex-direction:column;gap:0.5em;text-align:center}`
  } else if (l.header.style === 'minimal') {
    css += `.header .logo{font-size:0.95em}`
  }
  css += `.logo{font-family:var(--f-head);font-weight:700;color:var(--c-text);text-decoration:none;font-size:1.2em}`
  css += `.nav a{color:var(--c-text2);margin-left:1.5em;text-decoration:none;font-size:var(--fs-sm)}.nav a:hover{color:var(--c-link-h)}`

  // 5b. Blog header image
  css += `.blog-header-image{width:100%;max-height:400px;overflow:hidden}.blog-header-image img{width:100%;height:100%;object-fit:cover}`

  // 6. Cover image
  css += `.cover{margin-bottom:2em}.cover img{width:100%;max-height:400px;object-fit:cover;border-radius:8px}`

  // 7. Article page
  css += `.article__title{font-family:var(--f-head);font-size:var(--fs-h1);font-weight:700;line-height:var(--lh-head);margin:0 0 0.5em}`
  css += `.article__meta{color:var(--c-text-m);font-size:var(--fs-sm);margin-bottom:2em;display:flex;align-items:center;gap:0.5em;flex-wrap:wrap}`
  css += `.article__content p{margin:0 0 1.5em}`
  css += `.article__content img{border-radius:8px;margin:1.5em 0}`
  css += `.article__content blockquote{border-left:3px solid var(--c-primary);padding-left:1em;color:var(--c-text2);margin:1.5em 0}`
  css += `.article__content pre{background:var(--c-code-bg);border-radius:8px;padding:1em;overflow-x:auto;margin:1.5em 0}`
  css += `.article__content code{background:var(--c-code-bg);color:var(--c-code);font-family:var(--f-code);padding:2px 6px;border-radius:3px;font-size:0.9em}`
  css += `.article__content pre code{background:none;padding:0}`
  css += `.article__content ul,.article__content ol{padding-left:1.5em;margin:1em 0}`
  css += `.article__content li{margin-bottom:0.3em}`
  css += `.article__content table{width:100%;border-collapse:collapse;margin:1.5em 0}`
  css += `.article__content td,.article__content th{border:1px solid var(--c-border);padding:8px}`
  css += `.article__content hr{border:none;border-top:1px solid var(--c-border);margin:2em 0}`

  // 8. Heading decoration (h2)
  const h2Base = `.article__content h2{font-family:var(--f-head);font-size:var(--fs-h2);font-weight:700;line-height:var(--lh-head);margin:2.5em 0 0.8em`
  switch (comp.heading_style) {
    case 'underline':
      css += `${h2Base};border-bottom:3px solid var(--c-primary);padding-bottom:0.3em}`
      break
    case 'left_border':
      css += `${h2Base};border-left:4px solid var(--c-primary);padding-left:0.8em}`
      break
    case 'background':
      css += `${h2Base};background:${c.primary}18;padding:0.5em 0.8em;border-radius:4px}`
      break
    default:
      css += `${h2Base}}`
  }
  css += `.article__content h3{font-family:var(--f-head);font-size:var(--fs-h3);font-weight:700;line-height:var(--lh-head);margin:1.8em 0 0.5em}`

  // 9. Article list & cards
  css += `.article-list{display:flex;flex-direction:column;gap:1.5em}`
  css += `.article-card{text-decoration:none;color:inherit;display:block;transition:box-shadow 0.2s}`
  css += `.article-card__thumbnail img{aspect-ratio:16/9;object-fit:cover;width:100%;border-radius:8px}`
  css += `.article-card__title{font-size:1.1em;font-weight:700;margin:0.5em 0;color:var(--c-text)}`
  css += `.article-card__excerpt{font-size:var(--fs-sm);color:var(--c-text2);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}`
  css += `.article-card__meta{font-size:var(--fs-sm);color:var(--c-text-m);margin-top:0.3em}`

  switch (comp.article_card.style) {
    case 'card':
      css += `.article-card{border:1px solid var(--c-border);border-radius:8px;overflow:hidden}.article-card:hover{box-shadow:0 4px 12px rgba(0,0,0,0.08)}.article-card__body{padding:1em}.article-card__thumbnail img{border-radius:0}`
      break
    case 'list':
      css += `.article-card{display:flex;gap:1em}.article-card__thumbnail{width:200px;flex-shrink:0}`
      break
    default: // minimal
      css += `.article-card{border-bottom:1px solid var(--c-border);padding-bottom:1.5em}`
      break
  }

  // 10. Tags
  css += `.tag{display:inline-block;font-size:var(--fs-sm);border:1px solid var(--c-border);border-radius:3px;padding:1px 8px;color:var(--c-text2);text-decoration:none;margin-right:0.3em}.tag:hover{border-color:var(--c-primary);color:var(--c-primary)}`

  // 11. Author bio
  css += `.author-bio{display:flex;gap:12px;align-items:center;padding:1.5em 0;border-top:1px solid var(--c-border);margin-top:2em}`
  css += `.author-bio__avatar{width:48px;height:48px;border-radius:50%;object-fit:cover;flex-shrink:0}`
  css += `.author-bio__name{font-weight:700}.author-bio__description{font-size:var(--fs-sm);color:var(--c-text2);margin:0}`

  // 12. Footer
  css += `.footer{border-top:1px solid var(--c-border);padding:2em 0;text-align:center;color:var(--c-text-m);font-size:var(--fs-sm)}`
  css += `.footer a{color:var(--c-text-m)}.footer a:hover{color:var(--c-link-h)}`
  css += `.footer img{display:inline;vertical-align:middle}`

  // 13. Responsive
  css += `@media(max-width:768px){.container{padding:0 16px}.article__title{font-size:1.5em}.article__content h2{font-size:1.3em}.cover img{max-height:250px}`
  if (comp.article_card.style === 'list') {
    css += `.article-card{flex-direction:column}.article-card__thumbnail{width:100%}`
  }
  css += `}`

  // 14. Dark mode
  css += `@media(prefers-color-scheme:dark){:root{--c-bg:#0f0f0f;--c-surface:#1a1a1a;--c-text:#e5e5e5;--c-text2:#a0a0a0;--c-text-m:#707070;--c-border:#2a2a2a;--c-code-bg:#1e1e1e;--c-code:#d4d4d4}img{filter:brightness(.92)}}`

  return css
}

export function generateFontPreloads(theme: BlogTheme): string[] {
  const preloads: string[] = []
  const bodySlug = getFontSlug(theme.typography.font_family.body)
  const headSlug = getFontSlug(theme.typography.font_family.heading)

  if (bodySlug) {
    preloads.push(`/fonts/${bodySlug}/latin.woff2`)
    preloads.push(`/fonts/${bodySlug}/japanese.woff2`)
  }
  if (headSlug && headSlug !== bodySlug) {
    preloads.push(`/fonts/${headSlug}/latin.woff2`)
    preloads.push(`/fonts/${headSlug}/japanese.woff2`)
  }

  return preloads
}

// --- Migration ---

export function migrateOldSettings(settings: Record<string, unknown>): BlogTheme {
  // Already new v3 format (has css.inline)
  if (
    settings.css &&
    typeof settings.css === 'object' &&
    typeof (settings.css as Record<string, unknown>).inline === 'string' &&
    (settings.css as Record<string, unknown>).inline !== ''
  ) {
    return deepMerge(DEFAULT_THEME, settings as Partial<BlogTheme>)
  }

  // v3 format but css.inline is empty → fill it
  if (settings.colors && typeof settings.colors === 'object' && typeof (settings.colors as Record<string, unknown>).text === 'string') {
    const merged = deepMerge(DEFAULT_THEME, settings as Partial<BlogTheme>)
    merged.css = { inline: generateInlineCSS(merged) }
    merged.font_preload = generateFontPreloads(merged)
    return merged
  }

  // Legacy format (primaryColor, fontFamily, etc.)
  if (settings.primaryColor || settings.fontFamily) {
    const primaryColor = (settings.primaryColor as string) || DEFAULT_THEME.colors.primary
    const fontFamily = (settings.fontFamily as string) || DEFAULT_THEME.typography.font_family.body
    const partial: Partial<BlogTheme> = {
      colors: {
        ...DEFAULT_THEME.colors,
        primary: primaryColor,
        link: primaryColor,
        link_hover: primaryColor,
      },
      typography: {
        ...DEFAULT_THEME.typography,
        font_family: {
          heading: fontFamily,
          body: fontFamily,
          code: DEFAULT_THEME.typography.font_family.code,
        },
      },
    }
    const merged = deepMerge(DEFAULT_THEME, partial)
    merged.css = { inline: generateInlineCSS(merged) }
    merged.font_preload = generateFontPreloads(merged)
    return merged
  }

  // Empty or unknown → default with generated CSS
  const result = { ...DEFAULT_THEME }
  result.css = { inline: generateInlineCSS(result) }
  result.font_preload = generateFontPreloads(result)
  return result
}

// --- Utility ---

export function deepMerge<T extends Record<string, unknown>>(base: T, override: Partial<T>): T {
  const result = { ...base }
  for (const key of Object.keys(override) as Array<keyof T>) {
    const overrideVal = override[key]
    const baseVal = base[key]
    if (
      overrideVal !== null &&
      overrideVal !== undefined &&
      typeof overrideVal === 'object' &&
      !Array.isArray(overrideVal) &&
      typeof baseVal === 'object' &&
      baseVal !== null &&
      !Array.isArray(baseVal)
    ) {
      result[key] = deepMerge(
        baseVal as Record<string, unknown>,
        overrideVal as Record<string, unknown>,
      ) as T[keyof T]
    } else if (overrideVal !== undefined) {
      result[key] = overrideVal as T[keyof T]
    }
  }
  return result
}
