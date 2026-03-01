export function parseUserAgent(ua: string): { device_type: string; browser: string } {
  let device_type = 'desktop'
  if (/tablet|ipad/i.test(ua)) device_type = 'tablet'
  else if (/mobile|iphone|android.*mobile/i.test(ua)) device_type = 'mobile'

  let browser = 'other'
  if (/edg\//i.test(ua)) browser = 'Edge'
  else if (/chrome\//i.test(ua) && !/chromium/i.test(ua)) browser = 'Chrome'
  else if (/safari\//i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari'
  else if (/firefox\//i.test(ua)) browser = 'Firefox'
  else if (/opr\//i.test(ua) || /opera/i.test(ua)) browser = 'Opera'

  return { device_type, browser }
}
