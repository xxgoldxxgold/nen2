// OG Image Templates - 6 template renderers for ImageResponse JSX

export type OGTemplateType = 'standard' | 'bold' | 'split' | 'gradient' | 'minimal' | 'photo_overlay'

interface OGTemplateProps {
  title: string
  blogName: string
  date?: string
  excerpt?: string
  colors: {
    primary: string
    background: string
    surface: string
    text: string
    text_muted: string
  }
  logoUrl?: string
  coverImageUrl?: string
}

export function calcTitleSize(title: string): number {
  const len = title.length
  if (len <= 20) return 64
  if (len <= 40) return 52
  if (len <= 60) return 44
  if (len <= 80) return 38
  return 32
}

function LogoImage({ logoUrl }: { logoUrl: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt=""
      width={40}
      height={40}
      style={{ borderRadius: 6, objectFit: 'contain' }}
    />
  )
}

function BlogNameRow({ blogName, date, color, logoUrl }: { blogName: string; date?: string; color: string; logoUrl?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {logoUrl && <LogoImage logoUrl={logoUrl} />}
      <div style={{ fontSize: 20, color, display: 'flex' }}>{blogName}</div>
      {date && <div style={{ fontSize: 18, color, opacity: 0.7, display: 'flex' }}>{date}</div>}
    </div>
  )
}

export function renderOGTemplate(template: OGTemplateType, props: OGTemplateProps): React.ReactElement {
  switch (template) {
    case 'bold': return renderBold(props)
    case 'split': return renderSplit(props)
    case 'gradient': return renderGradient(props)
    case 'minimal': return renderMinimal(props)
    case 'photo_overlay': return renderPhotoOverlay(props)
    default: return renderStandard(props)
  }
}

function renderStandard({ title, blogName, date, colors, logoUrl }: OGTemplateProps) {
  const titleSize = calcTitleSize(title)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: colors.background, position: 'relative' }}>
      {/* Top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 6, background: colors.primary, display: 'flex' }} />
      {/* Decorative circles */}
      <div style={{ position: 'absolute', top: -80, right: -80, width: 350, height: 350, borderRadius: '50%', background: colors.primary, opacity: 0.08, display: 'flex' }} />
      <div style={{ position: 'absolute', bottom: -50, left: -50, width: 250, height: 250, borderRadius: '50%', background: colors.primary, opacity: 0.05, display: 'flex' }} />
      {/* Content */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, padding: '60px 80px' }}>
        <div style={{ fontSize: titleSize, fontWeight: 700, color: colors.text, lineHeight: 1.3, display: 'flex', maxWidth: 1000 }}>
          {title.length > 80 ? title.slice(0, 80) + '...' : title}
        </div>
      </div>
      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 80px', borderTop: `2px solid ${colors.primary}20` }}>
        <BlogNameRow blogName={blogName} date={date} color={colors.text_muted} logoUrl={logoUrl} />
      </div>
    </div>
  )
}

function renderBold({ title, blogName, date, colors, logoUrl }: OGTemplateProps) {
  const titleSize = Math.min(calcTitleSize(title) + 8, 72)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: colors.primary, position: 'relative' }}>
      {/* Content */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flex: 1, padding: '60px 80px', textAlign: 'center' }}>
        <div style={{ fontSize: titleSize, fontWeight: 700, color: '#ffffff', lineHeight: 1.25, display: 'flex', maxWidth: 1000, textAlign: 'center' }}>
          {title.length > 70 ? title.slice(0, 70) + '...' : title}
        </div>
      </div>
      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 80px', gap: 12 }}>
        {logoUrl && <LogoImage logoUrl={logoUrl} />}
        <div style={{ fontSize: 20, color: '#ffffffcc', display: 'flex' }}>{blogName}</div>
        {date && <div style={{ fontSize: 18, color: '#ffffff88', display: 'flex' }}>{date}</div>}
      </div>
    </div>
  )
}

function renderSplit({ title, blogName, date, colors, logoUrl }: OGTemplateProps) {
  const titleSize = calcTitleSize(title)
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      {/* Left: primary */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '45%', background: colors.primary, padding: '60px 50px' }}>
        {logoUrl && <div style={{ display: 'flex', marginBottom: 20 }}><LogoImage logoUrl={logoUrl} /></div>}
        <div style={{ fontSize: 22, color: '#ffffffcc', display: 'flex' }}>{blogName}</div>
        {date && <div style={{ fontSize: 18, color: '#ffffff88', marginTop: 8, display: 'flex' }}>{date}</div>}
      </div>
      {/* Right: background */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '55%', background: colors.background, padding: '60px 50px' }}>
        <div style={{ fontSize: titleSize, fontWeight: 700, color: colors.text, lineHeight: 1.3, display: 'flex' }}>
          {title.length > 70 ? title.slice(0, 70) + '...' : title}
        </div>
      </div>
    </div>
  )
}

function renderGradient({ title, blogName, date, colors, logoUrl }: OGTemplateProps) {
  const titleSize = calcTitleSize(title)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.surface} 100%)`, position: 'relative' }}>
      {/* Content */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, padding: '60px 80px' }}>
        <div style={{ fontSize: titleSize, fontWeight: 700, color: '#ffffff', lineHeight: 1.3, display: 'flex', maxWidth: 1000, textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
          {title.length > 80 ? title.slice(0, 80) + '...' : title}
        </div>
      </div>
      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {logoUrl && <LogoImage logoUrl={logoUrl} />}
          <div style={{ fontSize: 20, color: '#ffffffcc', display: 'flex' }}>{blogName}</div>
        </div>
        {date && <div style={{ fontSize: 18, color: '#ffffff88', display: 'flex' }}>{date}</div>}
      </div>
    </div>
  )
}

function renderMinimal({ title, blogName, date, colors, logoUrl }: OGTemplateProps) {
  const titleSize = calcTitleSize(title)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: colors.background }}>
      {/* Content */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, padding: '80px 100px' }}>
        <div style={{ fontSize: titleSize, fontWeight: 700, color: colors.text, lineHeight: 1.35, display: 'flex', maxWidth: 1000 }}>
          {title.length > 80 ? title.slice(0, 80) + '...' : title}
        </div>
      </div>
      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '24px 100px', gap: 12 }}>
        {logoUrl && <LogoImage logoUrl={logoUrl} />}
        <div style={{ fontSize: 18, color: colors.text_muted, display: 'flex' }}>{blogName}</div>
        {date && <div style={{ fontSize: 16, color: colors.text_muted, opacity: 0.7, display: 'flex' }}>{date}</div>}
      </div>
    </div>
  )
}

function renderPhotoOverlay({ title, blogName, date, colors, logoUrl, coverImageUrl }: OGTemplateProps) {
  // If no cover image, fall back to gradient template
  if (!coverImageUrl) {
    return renderGradient({ title, blogName, date, colors, logoUrl })
  }

  const titleSize = calcTitleSize(title)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', position: 'relative' }}>
      {/* Background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={coverImageUrl}
        alt=""
        width={1200}
        height={630}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
      {/* Overlay */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: `${colors.primary}bb`, display: 'flex' }} />
      {/* Content */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, padding: '60px 80px', position: 'relative' }}>
        <div style={{ fontSize: titleSize, fontWeight: 700, color: '#ffffff', lineHeight: 1.3, display: 'flex', maxWidth: 1000, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
          {title.length > 80 ? title.slice(0, 80) + '...' : title}
        </div>
      </div>
      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 80px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {logoUrl && <LogoImage logoUrl={logoUrl} />}
          <div style={{ fontSize: 20, color: '#ffffffcc', display: 'flex' }}>{blogName}</div>
        </div>
        {date && <div style={{ fontSize: 18, color: '#ffffff88', display: 'flex' }}>{date}</div>}
      </div>
    </div>
  )
}
