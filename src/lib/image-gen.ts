import { callClaude } from '@/lib/ai'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'

const SVG_SYSTEM_PROMPT = `You are a professional SVG illustrator specializing in beautiful, detailed vector art for web headers and banners.

CRITICAL RULES:
- Output ONLY the raw SVG markup. No explanation, no markdown code blocks, no backticks.
- Allowed elements: svg, rect, circle, ellipse, path, line, polygon, polyline, g, defs, linearGradient, radialGradient, stop, text, tspan, clipPath
- NEVER use: image, foreignObject, filter, feGaussianBlur, use, symbol, mask, pattern, animate, script, style, feTurbulence
- Always include xmlns="http://www.w3.org/2000/svg"
- Always set explicit width and height attributes on the svg element
- Always include viewBox attribute
- Text must use font-family="sans-serif"

ILLUSTRATION STYLE:
- Create DETAILED, layered flat vector illustrations — NOT childish or simplistic
- Use complex <path> elements with cubic bezier curves (C commands) for organic, natural shapes
- Build scenes with multiple overlapping layers at different opacities for depth
- Use 3-5 gradient definitions for sky, water, ground, and accent elements
- Create silhouettes and detailed outlines, not just basic circles and rectangles
- Aim for the quality of professional travel website hero illustrations
- SVG should be 4-8KB in size — use enough detail to look polished`

export async function generateHeaderSVG(
  theme: { primary: string; background: string; surface: string; text: string },
  blogName: string,
  style?: string,
): Promise<string> {
  const styleDesc = style
    ? `Theme: ${style}
Create a rich, detailed scene that captures this mood. Use layered path elements to build recognizable shapes (not abstract blobs).
For example, if the theme involves nature: draw actual tree silhouettes, mountain ridges, wave patterns, flower shapes, etc. using detailed path curves.`
    : `Create an elegant decorative banner with layered geometric and organic patterns.`

  const prompt = `Create a blog header banner SVG: width="1200" height="400" viewBox="0 0 1200 400".

Color palette to use:
- Primary: ${theme.primary}
- Background: ${theme.background}
- Surface: ${theme.surface}
- Text: ${theme.text}
- Also derive 2-3 complementary colors from the primary for variety

${styleDesc}

Composition requirements:
- Full-width scenic illustration as the background
- Multiple layers: background gradient → mid-ground elements → foreground details
- Use path elements with bezier curves for organic, natural-looking shapes
- Add depth with overlapping elements at varying opacities (0.1 to 0.8)
- Blog name "${blogName}" centered, 48-56px, font-family="sans-serif", fill="${theme.text}" with a subtle semi-transparent background rect behind it for readability
- The text should be clearly readable against the illustration
- IMPORTANT: width="1200" height="400" on the svg element`

  // Retry once if SVG extraction fails
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await callClaude(SVG_SYSTEM_PROMPT, prompt, 8192)
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

  const svg = await callClaude(SVG_SYSTEM_PROMPT, prompt, 8192)
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
