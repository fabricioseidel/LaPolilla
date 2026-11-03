/** Utilidades de presentación para la portada, la cabecera, el pie y las noticias. */

export type SocialKind = 'instagram' | 'youtube'
export type SocialLink = { kind: SocialKind; label: string; href: string }

const LABELS: Record<SocialKind, string> = { instagram: 'Instagram', youtube: 'YouTube' }
const HANDLE = /^@?([A-Za-z0-9._-]{1,60})$/

/**
 * Acepta lo que la editora escriba en el panel: una URL completa, «instagram.com/usuario»
 * o sólo «@usuario». Devuelve una URL https segura o nada.
 */
export function socialUrl(kind: SocialKind, value?: string | null): string | undefined {
  const v = value?.trim()
  if (!v) return undefined
  const withScheme = /^https?:\/\//i.test(v)
    ? v
    : /^(www\.|m\.)?(instagram\.com|youtube\.com|youtu\.be)\//i.test(v)
      ? `https://${v}`
      : undefined
  if (withScheme) {
    try {
      const url = new URL(withScheme)
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : undefined
    } catch {
      return undefined
    }
  }
  const handle = v.match(HANDLE)?.[1]
  if (!handle) return undefined
  return kind === 'instagram' ? `https://www.instagram.com/${handle}/` : `https://www.youtube.com/@${handle}`
}

export function socialLinks(settings: { social?: { instagram?: string | null; youtube?: string | null } | null }) {
  const links: SocialLink[] = []
  for (const kind of ['instagram', 'youtube'] as const) {
    const href = socialUrl(kind, settings.social?.[kind])
    if (href) links.push({ kind, label: LABELS[kind], href })
  }
  return links
}

const TZ = 'America/Santiago'
const dateFormat = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ })

/** «3 de noviembre de 2026». Las fechas del panel se guardan a mediodía UTC, así que no se corren de día. */
export const formatDate = (iso?: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : dateFormat.format(d)
}

export const currentYear = () => new Intl.DateTimeFormat('es-CL', { year: 'numeric', timeZone: TZ }).format(new Date())

/** Email de contacto válido para usar en un enlace mailto. */
export const safeEmail = (email?: string | null) =>
  email && /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']{2,}$/.test(email.trim()) ? email.trim() : undefined
