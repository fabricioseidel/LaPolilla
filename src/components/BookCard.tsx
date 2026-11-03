import Link from 'next/link'
import '@/app/(frontend)/styles/catalogo.css'
import { money } from '@/lib/format'
import type { Book } from '@/payload-types'
import { BookCover } from './catalogo/BookCover'
import { authorNames, availability, fromPrice } from './catalogo/libro'

/**
 * Tarjeta de libro: portada, título, autoría, "desde $…" y etiquetas.
 * Toda la tarjeta es clicable; el enlace accesible es el título.
 * Necesita la autoría poblada (depth ≥ 1) para mostrar los nombres.
 */
export function BookCard({ book, headingLevel = 3, priority = false }: { book: Book; headingLevel?: 2 | 3; priority?: boolean }) {
  const a = availability(book)
  const price = fromPrice(book)
  const authors = authorNames(book)
  const Heading = headingLevel === 2 ? 'h2' : 'h3'

  const chips: { label: string; kind: 'preventa' | 'ultimos' | 'agotado' }[] = []
  if (a.preventa) chips.push({ label: 'Preventa', kind: 'preventa' })
  if (a.physical === 'ultimos') chips.push({ label: 'Últimos ejemplares', kind: 'ultimos' })
  if (a.physical === 'agotado') chips.push({ label: 'Físico agotado', kind: 'agotado' })

  return (
    <article className="libro-card">
      <BookCover book={book} sizes="(min-width: 720px) 220px, 45vw" priority={priority} />
      <Heading className="libro-card-titulo">
        <Link href={`/libros/${book.slug}`} className="libro-card-enlace">
          {book.title}
        </Link>
      </Heading>
      {authors && <p className="libro-card-autoria">{authors}</p>}
      {price != null && (
        <p className="libro-card-precio">
          <span>desde</span> {money(price, 'CLP')}
        </p>
      )}
      {chips.length > 0 && (
        <ul className="cat-chips" aria-label="Disponibilidad">
          {chips.map((c) => (
            <li key={c.kind} className={`cat-chip cat-chip--${c.kind}`}>
              {c.label}
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
