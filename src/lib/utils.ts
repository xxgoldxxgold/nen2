/**
 * Generate a URL-safe slug from a string.
 * Handles Japanese characters by keeping them as-is (URL-encoded by the browser).
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s]+/g, '-')           // spaces to hyphens
    .replace(/[^\w\u3000-\u9FFF\u30A0-\u30FF\u3040-\u309F-]/g, '') // keep alphanumeric, Japanese, hyphens
    .replace(/-{2,}/g, '-')           // collapse multiple hyphens
    .replace(/^-|-$/g, '')            // trim leading/trailing hyphens
}

/**
 * Format a date string for display.
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format a relative time string (e.g., "3日前").
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return '今日'
  if (diffDays === 1) return '昨日'
  if (diffDays < 7) return `${diffDays}日前`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}ヶ月前`
  return `${Math.floor(diffDays / 365)}年前`
}
