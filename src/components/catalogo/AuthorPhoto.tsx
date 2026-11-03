import '@/app/(frontend)/styles/catalogo.css'
import type { Author } from '@/payload-types'
import { imageProps } from './libro'

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')

/** Foto redonda de una autora; si no hay foto, sus iniciales. */
export function AuthorPhoto({
  author,
  size = 'thumb',
  sizes = '96px',
  priority = false,
}: {
  author: Pick<Author, 'name' | 'photo'>
  size?: 'thumb' | 'card'
  sizes?: string
  priority?: boolean
}) {
  const img = imageProps(author.photo, size, `Foto de ${author.name}`)
  if (!img)
    return (
      <span className="autora-foto autora-foto--monograma" aria-hidden="true">
        {initials(author.name)}
      </span>
    )
  return (
    <img
      className="autora-foto"
      src={img.src}
      srcSet={img.srcSet}
      sizes={img.srcSet ? sizes : undefined}
      width={img.width}
      height={img.height}
      alt={img.alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
    />
  )
}
