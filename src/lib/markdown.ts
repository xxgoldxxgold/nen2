import { marked } from 'marked'
import sanitize from 'sanitize-html'

// Configure marked for clean HTML output
marked.setOptions({
  breaks: true,
  gfm: true,
})

const SANITIZE_OPTIONS: sanitize.IOptions = {
  allowedTags: sanitize.defaults.allowedTags.concat([
    'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'details', 'summary', 'mark', 'del', 'ins',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'pre', 'code', 'br', 'hr', 'sup', 'sub',
  ]),
  allowedAttributes: {
    ...sanitize.defaults.allowedAttributes,
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    a: ['href', 'title', 'target', 'rel'],
    code: ['class'],   // for syntax highlighting class names
    pre: ['class'],
    td: ['align'],
    th: ['align'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  // Strip all script/event handler attributes
  disallowedTagsMode: 'discard',
}

export function renderMarkdown(markdown: string): string {
  const raw = marked.parse(markdown, { async: false }) as string
  return sanitize(raw, SANITIZE_OPTIONS)
}

export function extractExcerpt(markdown: string, maxLength = 200): string {
  const plain = markdown
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/!\[.*?\]\(.+?\)/g, '')
    .replace(/>\s+/g, '')
    .replace(/[-*+]\s+/g, '')
    .replace(/\d+\.\s+/g, '')
    .replace(/\n{2,}/g, ' ')
    .replace(/\n/g, ' ')
    .trim()

  if (plain.length <= maxLength) return plain
  return plain.slice(0, maxLength).replace(/\s+\S*$/, '') + '...'
}

export function estimateReadTime(text: string): number {
  const charCount = text.replace(/\s/g, '').length
  const minutes = Math.ceil(charCount / 500)
  return Math.max(1, minutes)
}
