import '@/app/(frontend)/styles/catalogo.css'
import { MothMark } from '@/components/Logo'
import type { Book } from '@/payload-types'
import { imageProps } from './libro'

/** Portada en proporción 2:3 con sombra y lomo. Si falta la imagen, muestra una portada de reemplazo. */
export function BookCover({
  book,
  size = 'card',
  sizes,
  priority = false,
  className = '',
}: {
  book: Pick<Book, 'title' | 'cover'>
  size?: 'thumb' | 'card' | 'hero'
  /** Atributo `sizes` del <img> para elegir bien del srcset. */
  sizes?: string
  /** Portada principal de la página: se carga de inmediato. */
  priority?: boolean
  className?: string
}) {
  const img = imageProps(book.cover, size, `Portada de ${book.title}`)
  if (!img)
    return (
      <div className={`libro-portada libro-portada--vacia ${className}`} aria-hidden="true">
        <MothMark size={34} color="var(--moon)" />
        <span>{book.title}</span>
      </div>
    )
  return (
    <div className={`libro-portada ${className}`}>
      <img
        src={img.src}
        srcSet={img.srcSet}
        sizes={img.srcSet ? sizes : undefined}
        width={img.width}
        height={img.height}
        alt={img.alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
      />
    </div>
  )
}
