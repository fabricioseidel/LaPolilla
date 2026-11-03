import { BookCard } from '@/components/BookCard'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Libros' }

export default async function Catalogo() {
  const payload = await getPayloadClient()
  const books = await payload.find({ collection: 'books', sort: '-publishedAt', limit: 100 })
  return (
    <section>
      <h1>Libros</h1>
      <div className="grid">{books.docs.map((b) => <BookCard key={b.id} book={b} />)}</div>
    </section>
  )
}
