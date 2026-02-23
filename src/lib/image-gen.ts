import { callClaude } from '@/lib/ai'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'

const SVG_SYSTEM_PROMPT = `You are a professional graphic designer creating premium blog header banners using SVG.

CRITICAL RULES:
- Output ONLY the raw SVG markup. No explanation, no markdown code blocks, no backticks.
- Allowed elements: svg, rect, circle, ellipse, path, line, polygon, polyline, g, defs, linearGradient, radialGradient, stop, text, tspan, clipPath
- NEVER use: image, foreignObject, filter, use, symbol, mask, pattern, animate, script, style
- Always include xmlns="http://www.w3.org/2000/svg", viewBox, width, height
- Text must use font-family="sans-serif"

DESIGN PHILOSOPHY — ABSTRACT MOOD ART, NOT ILLUSTRATION:
- NEVER try to draw recognizable objects like trees, flowers, or buildings — they look childish in SVG
- Instead, create ABSTRACT, ATMOSPHERIC compositions using:
  * Rich multi-stop gradients (5-8 stops) for dramatic sky/mood effects
  * Flowing bezier curve paths that suggest waves, horizons, hills, or clouds abstractly
  * Layered translucent shapes at varying opacities (0.05 to 0.6) for depth and atmosphere
  * Organic curved bands of color that flow across the banner
- Think of Dribbble/Behance hero banners: sophisticated gradient art, not clip art
- Use 4-6 gradient definitions with harmonious color transitions
- Create at least 8-12 overlapping path layers for richness
- The result should look like premium wallpaper art or a polished app header`

export async function generateHeaderSVG(
  theme: { primary: string; background: string; surface: string; text: string },
  blogName: string,
  style?: string,
): Promise<string> {
  const styleDesc = style
    ? `Mood/atmosphere: ${style}
Evoke this mood through COLOR CHOICES and ABSTRACT FLOWING SHAPES only. Do NOT draw literal objects.
For example: "Hawaii" = warm coral-to-turquoise gradients with flowing wave-like curves; "Forest" = deep green layered gradient with organic curved shapes suggesting canopy.`
    : `Create an elegant, sophisticated gradient composition.`

  const prompt = `Create a blog header banner SVG: width="1200" height="400" viewBox="0 0 1200 400".

Base palette:
- Primary: ${theme.primary}
- Background: ${theme.background}
- Surface: ${theme.surface}
- Text: ${theme.text}
Derive 3-4 additional harmonious colors to create rich gradients.

${styleDesc}

Composition:
- Full-width abstract gradient art (NOT illustration, NOT clip art)
- Start with a dramatic multi-stop gradient background
- Add 8-12 overlapping flowing path shapes with bezier curves (C/S commands) at various opacities
- Paths should create smooth, organic wave-like or cloud-like bands of color flowing horizontally
- Layer translucent shapes to create depth and atmospheric feel
- Blog name "${blogName}" centered vertically and horizontally, 48px, font-family="sans-serif", fill with good contrast color
- Add a subtle semi-transparent rounded rect (rx="12") behind the text for readability
- IMPORTANT: width="1200" height="400" on the svg element`

  // Retry once if SVG extraction fails
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await callClaude(SVG_SYSTEM_PROMPT, prompt, 6000, 'claude-haiku-4-5-20251001')
    try {
      return extractSVG(raw)
    } catch (e) {
      if (attempt === 1) throw e
      console.warn('SVG generation attempt', attempt + 1, 'failed, retrying...')
    }
  }
  throw new Error('SVG generation failed after retries')
}

export async function generateCoverSVG(
  theme: { primary: string; background: string; surface: string; text: string },
  title: string,
): Promise<string> {
  const prompt = `Create a blog article cover image SVG: width="1200" height="630" viewBox="0 0 1200 630".

Color palette:
- Primary: ${theme.primary}
- Background: ${theme.background}
- Surface: ${theme.surface}
- Text: ${theme.text}

Design requirements:
- Elegant, professional banner suitable for social media sharing
- Layered gradient background with decorative geometric and organic elements
- Use path elements with curves for visual interest
- Article title "${title}" in lower-third area, 36-44px, font-family="sans-serif", fill="${theme.text}"
- Semi-transparent background behind title text for readability
- IMPORTANT: width="1200" height="630" on the svg element`

  const svg = await callClaude(SVG_SYSTEM_PROMPT, prompt, 6000, 'claude-haiku-4-5-20251001')
  return extractSVG(svg)
}

function extractSVG(raw: string): string {
  if (!raw || raw.trim().length === 0) {
    throw new Error('Claude returned empty response')
  }
  // Strip markdown code blocks if present
  const cleaned = raw.replace(/^```(?:svg|xml|html)?\s*/im, '').replace(/\s*```\s*$/im, '').trim()
  const match = cleaned.match(/<svg[\s\S]*<\/svg>/i)
  if (!match) {
    console.error('Failed to extract SVG. Response length:', raw.length, 'First 500 chars:', raw.slice(0, 500))
    throw new Error('Claude did not return valid SVG markup')
  }
  return match[0]
}

export async function svgToPng(svg: string, width: number, height: number): Promise<Buffer> {
  // Ensure SVG has explicit width/height for sharp compatibility
  let processedSvg = svg
  if (!/<svg[^>]*\bwidth\s*=/.test(processedSvg)) {
    processedSvg = processedSvg.replace('<svg', `<svg width="${width}" height="${height}"`)
  }

  const buf = Buffer.from(processedSvg)
  try {
    return await sharp(buf, { density: 150 })
      .resize(width, height, { fit: 'cover' })
      .png()
      .toBuffer()
  } catch (err) {
    console.error('sharp SVG→PNG conversion failed:', err)
    // Fallback: create a simple colored PNG with the theme colors
    return await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 200, g: 200, b: 200, alpha: 1 },
      },
    })
      .png()
      .toBuffer()
  }
}

function createStorageClient() {
  return createClient(
    process.env.NEXT_PUBLIC_NEN2_DB_URL!,
    process.env.NEN2_DB_SERVICE_ROLE_KEY!,
  )
}

export async function uploadImageToStorage(
  pngBuffer: Buffer,
  storagePath: string,
): Promise<string> {
  const db = createStorageClient()

  const { error } = await db.storage
    .from('blog-images')
    .upload(storagePath, pngBuffer, {
      contentType: 'image/png',
      upsert: true,
    })

  if (error) {
    console.error('Storage upload error:', error)
    throw new Error(`Storage upload failed: ${error.message}`)
  }

  const { data } = db.storage.from('blog-images').getPublicUrl(storagePath)
  return data.publicUrl
}
