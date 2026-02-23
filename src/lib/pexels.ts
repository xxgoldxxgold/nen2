const PEXELS_API_KEY = process.env.PEXELS_API_KEY

export interface PexelsPhoto {
  id: number
  url: string
  photographer: string
  photographer_url: string
  src: {
    original: string
    large2x: string
    large: string
    landscape: string
  }
}

export async function searchPexelsPhoto(query: string): Promise<PexelsPhoto> {
  if (!PEXELS_API_KEY) {
    throw new Error('PEXELS_API_KEY is not configured')
  }

  const params = new URLSearchParams({
    query,
    orientation: 'landscape',
    per_page: '1',
    size: 'large',
  })

  const res = await fetch(`https://api.pexels.com/v1/search?${params}`, {
    headers: { Authorization: PEXELS_API_KEY },
  })

  if (!res.ok) {
    throw new Error(`Pexels API error: ${res.status}`)
  }

  const data = await res.json()
  if (!data.photos || data.photos.length === 0) {
    throw new Error('No photos found for query: ' + query)
  }

  return data.photos[0] as PexelsPhoto
}
