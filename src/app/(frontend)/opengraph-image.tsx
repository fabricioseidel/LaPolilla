import { ImageResponse } from 'next/og'
import { MothSvg } from '@/lib/moth'
import { getPayloadClient } from '@/lib/payload'
import { DEFAULT_TAGLINE, SITE_URL } from '@/lib/seo'

/** Imagen para compartir el sitio en redes y mensajería (Next también la usa para Twitter/X). */
export const alt = 'Editorial La Polilla: una polilla dorada en el cielo de noche'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
// El lema se edita en el panel: la imagen se vuelve a generar, como mucho, cada hora.
export const revalidate = 3600

const C = { night: '#1C1830', gold: '#E8B04B', moon: '#F3EEF9', soft: '#D9D2E6', muted: '#B7AEC9', border: '#3A3356' }

async function getTagline() {
  try {
    const payload = await getPayloadClient()
    const s = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
    return s.tagline?.trim() || DEFAULT_TAGLINE
  } catch {
    return DEFAULT_TAGLINE
  }
}

/** Fuente de Google Fonts recortada a `text`. Si no se puede descargar, se usa la fuente por defecto. */
async function googleFont(family: string, weight: number, italic: boolean, text: string) {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${family}:ital,wght@${italic ? 1 : 0},${weight}&text=${encodeURIComponent(text)}`,
      { signal: AbortSignal.timeout(5000) },
    ).then((r) => r.text())
    const src = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1]
    if (!src) return null
    const res = await fetch(src, { signal: AbortSignal.timeout(5000) })
    return res.ok ? await res.arrayBuffer() : null
  } catch {
    return null
  }
}

/** Estrellas de fondo: [x, y, radio, opacidad]. */
const STARS: [number, number, number, number][] = [
  [140, 110, 3, 0.7],
  [230, 470, 2, 0.5],
  [330, 200, 2, 0.4],
  [960, 120, 3, 0.6],
  [1050, 380, 2, 0.5],
  [880, 520, 2, 0.4],
  [1110, 230, 2, 0.35],
  [90, 330, 2, 0.35],
]

export default async function Image() {
  const tagline = await getTagline()
  const host = new URL(SITE_URL).host
  const [title, italic, sans] = await Promise.all([
    googleFont('Fraunces', 600, false, 'La Polilla · Editorial'),
    googleFont('Fraunces', 400, true, tagline),
    googleFont('Inter', 500, false, host),
  ])
  const fonts = [
    title && { name: 'Fraunces', data: title, weight: 600 as const, style: 'normal' as const },
    italic && { name: 'Fraunces', data: italic, weight: 400 as const, style: 'italic' as const },
    sans && { name: 'Inter', data: sans, weight: 500 as const, style: 'normal' as const },
  ].filter((f) => f !== null)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          backgroundColor: C.night,
          backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(232,176,75,0.22) 0%, rgba(232,176,75,0.07) 26%, rgba(28,24,48,0) 52%)',
          color: C.moon,
        }}
      >
        {STARS.map(([x, y, r, o]) => (
          <div
            key={`${x}-${y}`}
            style={{ position: 'absolute', left: x, top: y, width: r * 2, height: r * 2, borderRadius: r, backgroundColor: C.soft, opacity: o }}
          />
        ))}
        <div
          style={{ position: 'absolute', top: 28, left: 28, right: 28, bottom: 28, border: `2px solid ${C.border}`, borderRadius: 28, display: 'flex' }}
        />
        <MothSvg width={264} color={C.gold} />
        <div style={{ display: 'flex', marginTop: 20, fontFamily: 'Fraunces', fontWeight: 600, fontSize: 84, letterSpacing: -1 }}>
          <span>La Polilla</span>
          <span style={{ color: C.gold, margin: '0 22px' }}>·</span>
          <span style={{ color: C.gold }}>Editorial</span>
        </div>
        <div style={{ display: 'flex', marginTop: 10, fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 40, color: C.soft }}>
          {tagline}
        </div>
        <div style={{ display: 'flex', width: 96, height: 3, marginTop: 34, backgroundColor: C.gold, borderRadius: 2 }} />
        <div style={{ display: 'flex', marginTop: 22, fontFamily: 'Inter', fontWeight: 500, fontSize: 26, letterSpacing: 1, color: C.muted }}>
          {host}
        </div>
      </div>
    ),
    { ...size, fonts },
  )
}
