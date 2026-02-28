// Blog Theme System v4 - Simplified: accent color + 2 fonts + header image
// Fixed single-column layout (note/Medium style)

export interface SimpleTheme {
  accent_color: string
  heading_font: string
  body_font: string
  header_image_url: string | null
}

export const DEFAULT_THEME: SimpleTheme = {
  accent_color: '#5c6b4a',
  heading_font: 'Noto Serif JP',
  body_font: 'Noto Sans JP',
  header_image_url: null,
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

export const AVAILABLE_FONTS = Object.keys(FONT_SLUG_MAP)

function getFontSlug(fontName: string): string | null {
  return FONT_SLUG_MAP[fontName] || null
}

/** Validate hex color. Returns sanitized value or default. */
export function sanitizeHexColor(value: string, fallback = DEFAULT_THEME.accent_color): string {
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value
  if (/^#[0-9a-fA-F]{3}$/.test(value)) return value
  return fallback
}

/** Validate font name against whitelist. */
export function sanitizeFontName(value: string, fallback: string): string {
  return FONT_SLUG_MAP[value] ? value : fallback
}

/** Build a Google Fonts CSS URL for the given fonts. */
export function generateGoogleFontsUrl(theme: SimpleTheme): string | null {
  const families: string[] = []
  const bodySlug = getFontSlug(theme.body_font)
  const headSlug = getFontSlug(theme.heading_font)

  if (bodySlug) families.push(`family=${theme.body_font.replace(/ /g, '+')}:wght@400;700`)
  if (headSlug && headSlug !== bodySlug) families.push(`family=${theme.heading_font.replace(/ /g, '+')}:wght@700`)

  if (families.length === 0) return null
  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`
}

// --- CSS generation ---

export function generateInlineCSS(theme: SimpleTheme): string {
  const { accent_color, heading_font, body_font } = theme

  let css = ''

  // 2. CSS variables
  css += `:root{--accent:${accent_color};--f-head:'${heading_font}',serif;--f-body:'${body_font}',sans-serif;--f-code:'Source Code Pro',monospace;--c-bg:#fafafa;--c-text:#1a1a1a;--c-text2:#555;--c-text-m:#888;--c-border:#e5e5e5;--mw:720px;--pad:24px}`

  // 3. Base styles
  css += `*,*::before,*::after{box-sizing:border-box}`
  css += `body{font-family:var(--f-body);font-size:16px;line-height:1.9;color:var(--c-text);background:var(--c-bg);margin:0;-webkit-font-smoothing:antialiased}`
  css += `img{max-width:100%;height:auto;display:block}`
  css += `a{color:var(--accent);text-decoration:underline}a:hover{opacity:0.8}`

  // 4. Layout (fixed single column)
  css += `.container{max-width:var(--mw);margin:0 auto;padding:0 var(--pad)}`

  // 5. Header
  css += `.header{border-bottom:1px solid var(--c-border)}`
  css += `.header-inner{max-width:var(--mw);margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:1em var(--pad)}`
  css += `.header-image{width:100%;max-height:300px;object-fit:cover}`
  css += `.logo{font-family:var(--f-head);font-weight:700;color:var(--c-text);text-decoration:none;font-size:1.2em}`
  css += `.nav a{color:var(--c-text2);margin-left:1.5em;text-decoration:none;font-size:0.875rem}.nav a:hover{color:var(--accent)}`

  // 6. Article page
  css += `.article__title{font-family:var(--f-head);font-size:2rem;font-weight:700;line-height:1.4;margin:0 0 0.5em}`
  css += `.article__meta{color:var(--c-text-m);font-size:0.875rem;margin-bottom:2em;display:flex;align-items:center;gap:0.5em;flex-wrap:wrap}`
  css += `.article__content p{margin:0 0 1.5em}`
  css += `.article__content img{border-radius:8px;margin:1.5em 0}`
  css += `.article__content blockquote{border-left:3px solid var(--accent);padding-left:1em;color:var(--c-text2);margin:1.5em 0}`
  css += `.article__content pre{background:#1e1e1e;color:#d4d4d4;border-radius:8px;padding:1em;overflow-x:auto;margin:1.5em 0}`
  css += `.article__content code{background:#f3f4f6;color:#1a1a1a;font-family:var(--f-code);padding:2px 6px;border-radius:3px;font-size:0.9em}`
  css += `.article__content pre code{background:none;color:inherit;padding:0}`
  css += `.article__content ul,.article__content ol{padding-left:1.5em;margin:1em 0}`
  css += `.article__content li{margin-bottom:0.3em}`
  css += `.article__content table{width:100%;border-collapse:collapse;margin:1.5em 0}`
  css += `.article__content td,.article__content th{border:1px solid var(--c-border);padding:8px}`
  css += `.article__content hr{border:none;border-top:1px solid var(--c-border);margin:2em 0}`
  css += `.article__content h2{font-family:var(--f-head);font-size:1.5rem;font-weight:700;line-height:1.4;margin:2.5em 0 0.8em;border-left:4px solid var(--accent);padding-left:0.8em}`
  css += `.article__content h3{font-family:var(--f-head);font-size:1.25rem;font-weight:700;line-height:1.4;margin:1.8em 0 0.5em}`

  // 7. Cover image
  css += `.cover{margin-bottom:2em}.cover img{width:100%;max-height:400px;object-fit:cover;border-radius:8px}`

  // 8. Article list (note style)
  css += `.article-list{display:flex;flex-direction:column;gap:0}`
  css += `.article-card{text-decoration:none;color:inherit;display:block;padding:1.5em 0;border-bottom:1px solid var(--c-border)}`
  css += `.article-card:hover .article-card__title{color:var(--accent)}`
  css += `.article-card__title{font-size:1.1em;font-weight:700;margin:0 0 0.3em;color:var(--c-text);transition:color 0.2s}`
  css += `.article-card__excerpt{font-size:0.875rem;color:var(--c-text2);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin:0}`
  css += `.article-card__meta{font-size:0.875rem;color:var(--c-text-m);margin-top:0.5em}`

  // 9. Tags
  css += `.tag{display:inline-block;font-size:0.875rem;border:1px solid var(--c-border);border-radius:3px;padding:1px 8px;color:var(--c-text2);text-decoration:none;margin-right:0.3em}.tag:hover{border-color:var(--accent);color:var(--accent)}`

  // 10. Author bio
  css += `.author-bio{display:flex;gap:12px;align-items:center;padding:1.5em 0;border-top:1px solid var(--c-border);margin-top:2em}`
  css += `.author-bio__avatar{width:48px;height:48px;border-radius:50%;object-fit:cover;flex-shrink:0}`
  css += `.author-bio__name{font-weight:700}.author-bio__description{font-size:0.875rem;color:var(--c-text2);margin:0}`

  // 11. Share buttons
  css += `.share-buttons{display:flex;gap:8px;margin:2em 0;padding:1.5em 0;border-top:1px solid var(--c-border)}`
  css += `.share-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:6px;font-size:0.875rem;text-decoration:none;color:#fff;transition:opacity 0.2s}.share-btn:hover{opacity:0.8;color:#fff}`

  // 12. Footer
  css += `.footer{border-top:1px solid var(--c-border);padding:2em 0;text-align:center;color:var(--c-text-m);font-size:0.875rem}`
  css += `.footer a{color:var(--c-text-m)}.footer a:hover{color:var(--accent)}`
  css += `.footer img{display:inline;vertical-align:middle}`

  // 13. Responsive
  css += `@media(max-width:768px){.container{padding:0 16px}.article__title{font-size:1.5em}.article__content h2{font-size:1.3em}.header-image{max-height:200px}}`

  // 14. Dark mode
  css += `@media(prefers-color-scheme:dark){:root{--c-bg:#0f0f0f;--c-text:#e5e5e5;--c-text2:#a0a0a0;--c-text-m:#707070;--c-border:#2a2a2a}.article__content code{background:#2a2a2a;color:#e5e5e5}img{filter:brightness(.92)}}`

  return css
}

/**
 * Build a SimpleTheme from profile columns.
 */
export function profileToTheme(profile: {
  accent_color: string
  heading_font: string
  body_font: string
  header_image_url: string | null
}): SimpleTheme {
  return {
    accent_color: sanitizeHexColor(profile.accent_color || ''),
    heading_font: sanitizeFontName(profile.heading_font || '', DEFAULT_THEME.heading_font),
    body_font: sanitizeFontName(profile.body_font || '', DEFAULT_THEME.body_font),
    header_image_url: profile.header_image_url,
  }
}
