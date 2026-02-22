import { callClaude } from '@/lib/ai'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'

const SVG_SYSTEM_PROMPT = `You are an SVG artist. Generate clean SVG markup for blog images.

RULES:
- Output ONLY the SVG markup, no explanation, no markdown code blocks
- Use only these elements: svg, rect, circle, ellipse, path, line, polygon, polyline, g, defs, linearGradient, radialGradient, stop, text, tspan
- NEVER use: image, foreignObject, filter, feGaussianBlur, use, symbol, clipPath, mask, pattern, animate, script, style
- Create abstract geometric designs (not photorealistic)
- Use the provided color palette
- Text must use generic font families: sans-serif, serif, or monospace
- Keep SVG simple and clean (under 3KB)
- Always include xmlns="http://www.w3.org/2000/svg"
- Always set explicit width and height attributes on the svg element matching the viewBox dimensions
- Always include viewBox attribute`

export async function generateHeaderSVG(
  theme: { primary: string; background: string; surface: string; text: string },
  blogName: string,
  style?: string,
): Promise<string> {
  const styleDesc = style
    ? `- Design theme/mood: ${style}\n- Incorporate visual elements that evoke this theme`
    : `- Abstract geometric pattern as background decoration`

  const prompt = `Create a blog header banner SVG with width="1200" height="400" viewBox="0 0 1200 400".

Color palette:
- Primary: ${theme.primary}
- Background: ${theme.background}
- Surface: ${theme.surface}
- Text: ${theme.text}

Design requirements:
${styleDesc}
- Blog name "${blogName}" centered, large text (48-64px), font-family="sans-serif", fill="${theme.text}"
- Subtle gradient background using primary and background colors
- Decorative shapes (circles, lines, polygons) using primary color at various opacities
- Clean, modern, professional look
- IMPORTANT: Set width="1200" height="400" on the svg element`

  const svg = await callClaude(SVG_SYSTEM_PROMPT, prompt, 2048)
  return extractSVG(svg)
}

export async function generateCoverSVG(
  theme: { primary: string; background: string; surface: string; text: string },
  title: string,
): Promise<string> {
  const prompt = `Create a blog article cover image SVG with width="1200" height="630" viewBox="0 0 1200 630".

Color palette:
- Primary: ${theme.primary}
- Background: ${theme.background}
- Surface: ${theme.surface}
- Text: ${theme.text}

Design requirements:
- Abstract geometric pattern as main visual
- Article title "${title}" displayed in lower-third area, 32-40px, font-family="sans-serif", fill="${theme.text}"
- Gradient background blending primary and background colors
- Decorative geometric shapes (circles, rectangles, lines) at various opacities
- Professional and eye-catching design suitable for social media sharing
- IMPORTANT: Set width="1200" height="630" on the svg element`

  const svg = await callClaude(SVG_SYSTEM_PROMPT, prompt, 2048)
  return extractSVG(svg)
}

function extractSVG(raw: string): string {
  const match = raw.match(/<svg[\s\S]*<\/svg>/i)
  if (!match) {
    console.error('Failed to extract SVG from Claude response:', raw.slice(0, 200))
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
