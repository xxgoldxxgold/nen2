import { callClaude } from '@/lib/ai'
import sharp from 'sharp'
import { createDataServer } from '@/lib/supabase/data-server'

const SVG_SYSTEM_PROMPT = `You are an SVG artist. Generate clean SVG markup for blog images.

RULES:
- Output ONLY the SVG markup, no explanation
- Use only these elements: svg, rect, circle, ellipse, path, line, polygon, polyline, g, defs, linearGradient, radialGradient, stop, text, tspan
- NEVER use: image, foreignObject, filter, feGaussianBlur, use, symbol, clipPath, mask, pattern, animate, script, style
- Create abstract geometric designs (not photorealistic)
- Use the provided color palette
- Text must use generic font families: sans-serif, serif, or monospace
- Keep SVG simple and clean (under 3KB)
- Always include xmlns="http://www.w3.org/2000/svg"
- Always include viewBox attribute`

export async function generateHeaderSVG(
  theme: { primary: string; background: string; surface: string; text: string },
  blogName: string,
): Promise<string> {
  const prompt = `Create a blog header banner SVG (viewBox="0 0 1200 400").

Color palette:
- Primary: ${theme.primary}
- Background: ${theme.background}
- Surface: ${theme.surface}
- Text: ${theme.text}

Design requirements:
- Abstract geometric pattern as background decoration
- Blog name "${blogName}" centered, large text (48-64px), font-family sans-serif, fill with text color
- Subtle gradient background using primary and background colors
- Decorative shapes (circles, lines, polygons) using primary color at various opacities
- Clean, modern, professional look`

  const svg = await callClaude(SVG_SYSTEM_PROMPT, prompt, 2048)
  return extractSVG(svg)
}

export async function generateCoverSVG(
  theme: { primary: string; background: string; surface: string; text: string },
  title: string,
): Promise<string> {
  const prompt = `Create a blog article cover image SVG (viewBox="0 0 1200 630").

Color palette:
- Primary: ${theme.primary}
- Background: ${theme.background}
- Surface: ${theme.surface}
- Text: ${theme.text}

Design requirements:
- Abstract geometric pattern as main visual
- Article title "${title}" displayed in lower-third area, 32-40px, font-family sans-serif, fill with text color
- Gradient background blending primary and background colors
- Decorative geometric shapes (circles, rectangles, lines) at various opacities
- Professional and eye-catching design suitable for social media sharing`

  const svg = await callClaude(SVG_SYSTEM_PROMPT, prompt, 2048)
  return extractSVG(svg)
}

function extractSVG(raw: string): string {
  const match = raw.match(/<svg[\s\S]*<\/svg>/i)
  return match ? match[0] : raw.trim()
}

export async function svgToPng(svg: string, width: number, height: number): Promise<Buffer> {
  const buf = Buffer.from(svg)
  return sharp(buf)
    .resize(width, height)
    .png()
    .toBuffer()
}

export async function uploadImageToStorage(
  pngBuffer: Buffer,
  storagePath: string,
): Promise<string> {
  const db = createDataServer()

  const { error } = await db.storage
    .from('blog-images')
    .upload(storagePath, pngBuffer, {
      contentType: 'image/png',
      upsert: true,
    })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  const { data } = db.storage.from('blog-images').getPublicUrl(storagePath)
  return data.publicUrl
}
