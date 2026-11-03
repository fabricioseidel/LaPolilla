import type { Illustration } from '@/payload-types'
import type { GaleriaItem } from './GaleriaGrid'
import { VISIBLE_STATUSES, imageProps } from './libro'

/** Datos serializables de una ilustración para la galería (sólo enlaza libros visibles al público). */
export function galeriaItem(i: Illustration): GaleriaItem | null {
  const media = typeof i.image === 'object' ? i.image : null
  const alt = media?.alt?.trim() || i.title
  const thumb = imageProps(media, 'card', alt)
  const big = imageProps(media, 'hero', alt)
  if (!thumb || !big) return null
  const book =
    i.book && typeof i.book === 'object' && i.book.slug && i.book.status && VISIBLE_STATUSES.includes(i.book.status)
      ? { title: i.book.title, slug: i.book.slug }
      : null
  return { id: i.id, title: i.title, artist: i.artist || null, description: i.description || null, thumb, big, book }
}
