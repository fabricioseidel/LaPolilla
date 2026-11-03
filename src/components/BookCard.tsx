import Link from 'next/link'
import type { Book } from '@/payload-types'
import { mediaUrl } from '@/lib/format'

export function BookCard({ book }: { book: Book }) {
  const src = mediaUrl(book.cover, 'card')
  return (
    <Link href={`/libros/${book.slug}`} className="book-card">
      {src ? <img src={src} alt={`Portada de ${book.title}`} /> : <div className="cover-placeholder">{book.title}</div>}
      <h3>{book.title}</h3>
      {book.status === 'preventa' && <span className="tag">Preventa</span>}
    </Link>
  )
}
