import { callClaude } from '@/lib/ai'

const SVG_SYSTEM_PROMPT = `You are a graphic designer. Output ONLY raw SVG markup — no explanation, no markdown, no backticks.

RULES:
- Output starts with <svg and ends with </svg>
- Include xmlns="http://www.w3.org/2000/svg", viewBox, width, height
- Allowed: svg, rect, circle, ellipse, path, line, polygon, g, defs, linearGradient, radialGradient, stop, text, tspan, clipPath
- NEVER use: image, foreignObject, filter, use, symbol, mask, pattern, animate, script, style, feGaussianBlur
- Text: font-family="sans-serif"
- Keep paths simple — use L, Q, C commands with few control points
- Maximum 3 gradients, each with 2-4 stops
- Maximum 6 shapes/paths total
- Prioritize clean, valid SVG over complexity`

export async function generateHeaderSVG(
  theme: { primary: string; background: string; surface: string; text: string },
  blogName: string,
  style?: string,
): Promise<string> {
  const styleDesc = style
    ? `Color mood: ${style}. Use colors that evoke this mood.`
    : `Use elegant gradient colors.`

  const prompt = `Create a blog header SVG: width="1200" height="400" viewBox="0 0 1200 400".

Colors: primary=${theme.primary}, bg=${theme.background}, surface=${theme.surface}, text=${theme.text}

${styleDesc}

Design:
1. Full-width gradient background (2-3 gradient stops)
2. 3-5 overlapping translucent curved shapes for depth (use simple Q or C bezier curves, opacity 0.1-0.4)
3. Blog name "${blogName}" centered, 48px, font-family="sans-serif", with semi-transparent rect behind it for readability

Keep SVG simple and under 3000 characters. Output the <svg>...</svg> directly.`

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const raw = await callClaude(SVG_SYSTEM_PROMPT, prompt, 4096, 'claude-haiku-4-5-20251001')
      return extractSVG(raw)
    } catch (e) {
      console.warn(`Header SVG attempt ${attempt + 1} failed:`, e instanceof Error ? e.message : e)
      if (attempt === 2) {
        return generateFallbackHeaderSVG(theme, blogName)
      }
    }
  }
  return generateFallbackHeaderSVG(theme, blogName)
}

export async function generateCoverSVG(
  theme: { primary: string; background: string; surface: string; text: string },
  title: string,
): Promise<string> {
  const prompt = `Create a blog cover image SVG: width="1200" height="630" viewBox="0 0 1200 630".

Colors: primary=${theme.primary}, bg=${theme.background}, surface=${theme.surface}, text=${theme.text}

Design:
1. Gradient background (2-3 stops)
2. 2-4 decorative shapes (circles, rounded rects, or simple curves) at various opacities
3. Article title "${title}" near center-bottom, 36px, font-family="sans-serif", fill="${theme.text}"
4. Semi-transparent rounded rect behind the title text

Keep SVG simple and under 3000 characters. Output the <svg>...</svg> directly.`

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const raw = await callClaude(SVG_SYSTEM_PROMPT, prompt, 4096, 'claude-haiku-4-5-20251001')
      return extractSVG(raw)
    } catch (e) {
      console.warn(`Cover SVG attempt ${attempt + 1} failed:`, e instanceof Error ? e.message : e)
      if (attempt === 2) {
        return generateFallbackCoverSVG(theme, title)
      }
    }
  }
  return generateFallbackCoverSVG(theme, title)
}

export async function generateLogoSVG(
  theme: { primary: string; background: string; surface: string; text: string },
  blogName: string,
  style?: string,
): Promise<string> {
  const firstChar = blogName.charAt(0).toUpperCase()
  const styleDesc = style
    ? `Design style: ${style}.`
    : `Design a modern, memorable logo mark.`

  const prompt = `Create a blog logo SVG: width="400" height="400" viewBox="0 0 400 400".

Colors: primary=${theme.primary}, bg=${theme.background}, surface=${theme.surface}, text=${theme.text}
Blog name: "${blogName}" (first letter: "${firstChar}")

${styleDesc}

Design a LOGO MARK (icon-style logo), not just text. Ideas:
1. An abstract geometric shape or symbol incorporating the letter "${firstChar}"
2. Use primary color as the main color
3. The shape should work at small sizes (32px) and large sizes
4. Include the letter "${firstChar}" integrated into or on top of the geometric shape
5. Use rounded corners (rx/ry) for a modern feel
6. Background should be transparent (no background rect)

Keep SVG simple and under 2000 characters. Output the <svg>...</svg> directly.`

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const raw = await callClaude(SVG_SYSTEM_PROMPT, prompt, 4096, 'claude-haiku-4-5-20251001')
      return extractSVG(raw)
    } catch (e) {
      console.warn(`Logo SVG attempt ${attempt + 1} failed:`, e instanceof Error ? e.message : e)
      if (attempt === 2) {
        return generateFallbackLogoSVG(theme, firstChar)
      }
    }
  }
  return generateFallbackLogoSVG(theme, firstChar)
}

export async function generateFaviconSVG(
  theme: { primary: string; background: string },
  blogName: string,
  style?: string,
): Promise<string> {
  const firstChar = blogName.charAt(0).toUpperCase()
  const styleDesc = style
    ? `Design style: ${style}.`
    : `Design a clean, bold favicon.`

  const prompt = `Create a favicon SVG: width="64" height="64" viewBox="0 0 64 64".

Colors: primary=${theme.primary}, bg=${theme.background}
Letter: "${firstChar}"

${styleDesc}

Design rules:
1. Simple shape that works at 16x16 to 64x64 pixels
2. Use primary color as background or main element
3. White or light letter "${firstChar}" prominently displayed, 32-40px size
4. Rounded square (rx="12") or circle as the base shape
5. Maximum 3 elements total — keep extremely simple
6. Must be clearly readable at tiny sizes

Keep SVG under 500 characters. Output the <svg>...</svg> directly.`

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const raw = await callClaude(SVG_SYSTEM_PROMPT, prompt, 2048, 'claude-haiku-4-5-20251001')
      return extractSVG(raw)
    } catch (e) {
      console.warn(`Favicon SVG attempt ${attempt + 1} failed:`, e instanceof Error ? e.message : e)
      if (attempt === 2) {
        return generateFallbackFaviconSVG(theme.primary, firstChar)
      }
    }
  }
  return generateFallbackFaviconSVG(theme.primary, firstChar)
}

function extractSVG(raw: string): string {
  if (!raw || raw.trim().length === 0) {
    throw new Error('Empty response from Claude')
  }

  let cleaned = raw
    .replace(/^```(?:svg|xml|html|markup)?\s*\n?/gim, '')
    .replace(/\n?\s*```\s*$/gim, '')
    .trim()

  const match = cleaned.match(/<svg[\s\S]*<\/svg>/i)
  if (match) return match[0]

  // SVG might be truncated — try to close it
  const svgStart = cleaned.match(/<svg[\s\S]*/i)
  if (svgStart) {
    let partial = svgStart[0]
    if (!partial.includes('</svg>')) {
      partial = partial.replace(/<[^>]*$/, '')
      partial += '</svg>'
    }
    if (/<svg[\s\S]*<\/svg>/i.test(partial)) {
      console.warn('SVG was truncated, auto-closed.')
      return partial
    }
  }

  throw new Error('Could not extract valid SVG from response')
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function generateFallbackHeaderSVG(
  theme: { primary: string; background: string; surface: string; text: string },
  blogName: string,
): string {
  const safeName = escapeXml(blogName)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400" viewBox="0 0 1200 400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.background}"/>
      <stop offset="100%" stop-color="${theme.surface}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="400" fill="url(#bg)"/>
  <circle cx="200" cy="100" r="180" fill="${theme.primary}" opacity="0.08"/>
  <circle cx="1000" cy="300" r="220" fill="${theme.primary}" opacity="0.06"/>
  <circle cx="600" cy="350" r="150" fill="${theme.primary}" opacity="0.05"/>
  <rect x="350" y="165" width="500" height="70" rx="12" fill="${theme.surface}" opacity="0.7"/>
  <text x="600" y="210" text-anchor="middle" font-family="sans-serif" font-size="42" font-weight="700" fill="${theme.text}">${safeName}</text>
</svg>`
}

function generateFallbackLogoSVG(
  theme: { primary: string; background: string; surface: string; text: string },
  firstChar: string,
): string {
  const safeChar = escapeXml(firstChar)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect x="40" y="40" width="320" height="320" rx="64" fill="${theme.primary}"/>
  <text x="200" y="248" text-anchor="middle" font-family="sans-serif" font-size="200" font-weight="700" fill="#ffffff">${safeChar}</text>
</svg>`
}

function generateFallbackFaviconSVG(primary: string, firstChar: string): string {
  const safeChar = escapeXml(firstChar)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="${primary}"/>
  <text x="32" y="44" text-anchor="middle" font-family="sans-serif" font-size="36" font-weight="700" fill="#ffffff">${safeChar}</text>
</svg>`
}

function generateFallbackCoverSVG(
  theme: { primary: string; background: string; surface: string; text: string },
  title: string,
): string {
  const safeTitle = escapeXml(title)
  const displayTitle = safeTitle.length > 40 ? safeTitle.slice(0, 37) + '...' : safeTitle
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.background}"/>
      <stop offset="50%" stop-color="${theme.surface}"/>
      <stop offset="100%" stop-color="${theme.background}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="150" cy="100" r="200" fill="${theme.primary}" opacity="0.07"/>
  <circle cx="1050" cy="530" r="250" fill="${theme.primary}" opacity="0.05"/>
  <rect x="100" y="440" width="1000" height="80" rx="16" fill="${theme.surface}" opacity="0.8"/>
  <text x="600" y="492" text-anchor="middle" font-family="sans-serif" font-size="36" font-weight="700" fill="${theme.text}">${displayTitle}</text>
</svg>`
}
