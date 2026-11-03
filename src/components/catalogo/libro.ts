import type { Author, Book } from '@/payload-types'

/** Estados que ve el público. Los borradores sólo los ve el equipo. */
export const VISIBLE_STATUSES: NonNullable<Book['status']>[] = ['publicado', 'preventa']
export const visibleWhere = { status: { in: VISIBLE_STATUSES } }

/** Con este stock o menos se muestra "Últimos ejemplares". */
export const LOW_STOCK = 10

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://lapolilla.vercel.app').replace(/\/$/, '')
export const absoluteUrl = (pathOrUrl: string) => new URL(pathOrUrl, SITE_URL + '/').toString()

export const authorsOf = (book: Pick<Book, 'authors'>) =>
  (book.authors ?? []).filter((a): a is Author => typeof a === 'object' && a !== null)

export const authorNames = (book: Pick<Book, 'authors'>) => listJoin(authorsOf(book).map((a) => a.name))

/** "Ana", "Ana y Luis", "Ana, Luis y Eva" */
export const listJoin = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`

/** Campos que necesita una tarjeta de libro (para pedir sólo eso con `select`). */
export const cardSelect = {
  title: true,
  slug: true,
  authors: true,
  cover: true,
  status: true,
  digitalEnabled: true,
  physicalEnabled: true,
  priceDigitalCLP: true,
  pricePhysicalCLP: true,
  fulfillment: true,
  stock: true,
} as const
export type CardBook = Pick<Book, 'id' | keyof typeof cardSelect>
type SaleFields = Pick<
  Book,
  'status' | 'digitalEnabled' | 'physicalEnabled' | 'fulfillment' | 'stock' | 'priceDigitalCLP' | 'pricePhysicalCLP'
>

export type PhysicalState = 'disponible' | 'ultimos' | 'agotado' | 'pod'

/** Qué se puede comprar y en qué estado está el libro impreso. */
export function availability(book: SaleFields) {
  let physical: PhysicalState | null = null
  if (book.physicalEnabled) {
    if (book.fulfillment === 'pod') physical = 'pod'
    else {
      const stock = book.stock ?? 0
      physical = stock <= 0 ? 'agotado' : stock <= LOW_STOCK ? 'ultimos' : 'disponible'
    }
  }
  return {
    preventa: book.status === 'preventa',
    digital: Boolean(book.digitalEnabled),
    physical,
    stock: book.fulfillment === 'stock' ? Math.max(0, book.stock ?? 0) : null,
  }
}

/** Precio más bajo en CLP entre los formatos que se pueden comprar hoy. */
export function fromPrice(book: SaleFields): number | null {
  const a = availability(book)
  const prices: number[] = []
  if (a.digital && book.priceDigitalCLP != null) prices.push(book.priceDigitalCLP)
  if (a.physical && a.physical !== 'agotado' && book.pricePhysicalCLP != null) prices.push(book.pricePhysicalCLP)
  return prices.length ? Math.min(...prices) : null
}

type Size = { url?: string | null; width?: number | null; height?: number | null }
type MediaLike = Size & { alt?: string | null; sizes?: Record<string, Size | undefined> | null }

export type ImageProps = { src: string; srcSet?: string; width?: number; height?: number; alt: string }

/**
 * Atributos para <img> a partir de un documento de `media`: `src` en el tamaño pedido
 * y `srcSet` con los tamaños que existen (Payload no agranda imágenes pequeñas).
 */
export function imageProps(m: unknown, size: 'thumb' | 'card' | 'hero', alt?: string): ImageProps | undefined {
  if (!m || typeof m !== 'object') return undefined
  const media = m as MediaLike
  if (!media.url) return undefined
  const chosen = media.sizes?.[size]?.url ? media.sizes[size]! : media
  const candidates = [...Object.values(media.sizes ?? {}), media].filter(
    (s): s is Size & { url: string; width: number } => Boolean(s?.url && s.width),
  )
  const seen = new Set<number>()
  const srcSet = candidates
    .sort((a, b) => a.width - b.width)
    .filter((s) => (seen.has(s.width) ? false : (seen.add(s.width), true)))
    .map((s) => `${s.url} ${s.width}w`)
    .join(', ')
  return {
    src: chosen.url!,
    srcSet: srcSet || undefined,
    width: chosen.width ?? undefined,
    height: chosen.height ?? undefined,
    alt: alt ?? media.alt ?? '',
  }
}

type LexicalNode = { type?: string; text?: string; children?: LexicalNode[] }
const BLOCKS = new Set(['paragraph', 'heading', 'quote', 'list', 'listitem'])

/** Texto plano de un campo richText (para descripciones y extractos). */
export function plainText(rich: unknown, max?: number): string {
  const root = (rich as { root?: LexicalNode } | null)?.root
  if (!root) return ''
  const walk = (n: LexicalNode): string =>
    n.type === 'linebreak'
      ? ' '
      : (n.text ?? '') + (n.children ?? []).map((c) => (BLOCKS.has(c.type ?? '') ? ` ${walk(c)} ` : walk(c))).join('')
  const text = walk(root).replace(/\s+/g, ' ').trim()
  if (!max || text.length <= max) return text
  const cut = text.slice(0, max)
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 20)).replace(/[\s,.;:]+$/, '') + '…'
}

export const formatDate = (iso?: string | null) =>
  iso
    ? new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Santiago' }).format(
        new Date(iso),
      )
    : ''

/** "1 h 05 min", "12 min", "45 s" */
export function formatLongDuration(sec: number) {
  const s = Math.round(sec)
  if (s < 60) return `${s} s`
  const h = Math.floor(s / 3600)
  const m = Math.round((s % 3600) / 60)
  return h ? `${h} h ${String(m).padStart(2, '0')} min` : `${m} min`
}

/** "730 B", "350 KB", "1,2 MB" */
export function formatBytes(n?: number | null) {
  if (!n) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / (1024 * 1024)).toLocaleString('es-CL', { maximumFractionDigits: 1 })} MB`
}

/** Sólo enlaces http(s) o mailto (los escribe el equipo, pero mejor no confiar en `javascript:`). */
export const safeHref = (url?: string | null) => (url && /^(https?:\/\/|mailto:)/i.test(url.trim()) ? url.trim() : undefined)

/** "1 libro", "3 libros" */
export const plural = (n: number, singular: string, pluralForm = `${singular}s`) => `${n} ${n === 1 ? singular : pluralForm}`

/** Normaliza para búsquedas: sin tildes ni mayúsculas. */
export const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
