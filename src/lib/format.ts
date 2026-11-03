export const money = (n: number | null | undefined, currency: 'CLP' | 'USD') =>
  n == null ? '' : new Intl.NumberFormat(currency === 'CLP' ? 'es-CL' : 'en-US', { style: 'currency', currency }).format(n)

export const mediaUrl = (m: unknown, size?: 'thumb' | 'card' | 'hero') => {
  if (!m || typeof m !== 'object') return undefined
  const media = m as { url?: string | null; sizes?: Record<string, { url?: string | null }> }
  return (size && media.sizes?.[size]?.url) || media.url || undefined
}

export const youtubeId = (url?: string | null) => url?.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1]
