/** Datos del sitio para metadatos, sitemap, robots y enlaces absolutos (correos). */

const FALLBACK_URL = 'https://lapolilla.vercel.app'

/** URL pública sin "/" final. Viene de NEXT_PUBLIC_SITE_URL; si falta o no es válida, la de producción. */
export const SITE_URL = (() => {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (raw) {
    try {
      return new URL(raw).toString().replace(/\/+$/, '')
    } catch {
      // URL mal escrita: mejor el respaldo que romper todos los metadatos
    }
  }
  return FALLBACK_URL
})()

export const SITE_NAME = 'Editorial La Polilla'

export const SITE_DESCRIPTION =
  'Editorial La Polilla: libros digitales en EPUB y PDF para todo el mundo, libros impresos con envío en Chile y audiolibros incluidos con cada compra.'

/** Lema por defecto (el mismo valor inicial del campo "Lema" en Configuración del sitio). */
export const DEFAULT_TAGLINE = 'Libros que vuelan de noche'

/** Convierte una ruta interna ("/libros/x") en URL absoluta del sitio. */
export const absoluteUrl = (path = '/') => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`

/**
 * Enlace externo escrito en el panel: sólo http(s) o mailto. "instagram.com/x" se completa
 * con https://; cualquier otra cosa (p. ej. "javascript:") se descarta.
 */
export function externalUrl(url?: string | null): string | undefined {
  const u = url?.trim()
  if (!u) return undefined
  if (/^(https?:|mailto:)/i.test(u)) return u
  if (/^[\w-]+(\.[\w-]+)+(\/|$)/.test(u)) return `https://${u}`
  return undefined
}

/** JSON-LD listo para <script type="application/ld+json"> (escapa "<" para evitar inyección de HTML). */
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c')
