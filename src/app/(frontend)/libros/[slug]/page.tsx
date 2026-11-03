import { RichText } from '@payloadcms/richtext-lexical/react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AddToCart } from '@/components/AddToCart'
import { mediaUrl, money, youtubeId } from '@/lib/format'
import { getPayloadClient } from '@/lib/payload'
import { gateways } from '@/lib/payments/config'
import type { Author } from '@/payload-types'

export const dynamic = 'force-dynamic'

const getBook = async (slug: string) => {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'books', where: { slug: { equals: slug } }, limit: 1, depth: 1 })
  return res.docs[0]
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const book = await getBook((await params).slug)
  return { title: book?.title, openGraph: { images: mediaUrl(book?.cover, 'card') } }
}

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const book = await getBook((await params).slug)
  if (!book) notFound()
  const authors = (book.authors ?? []).filter((a): a is Author => typeof a === 'object')
  const yt = youtubeId(book.trailerYoutube)
  const outOfStock = book.fulfillment === 'stock' && (book.stock ?? 0) <= 0
  const sampleUrl = mediaUrl(book.sample)
  const intl = gateways().lemonsqueezy

  return (
    <article className="book">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Book',
            name: book.title,
            isbn: book.isbn,
            author: authors.map((a) => ({ '@type': 'Person', name: a.name })),
            image: mediaUrl(book.cover),
          }),
        }}
      />
      <img src={mediaUrl(book.cover, 'card')} alt={`Portada de ${book.title}`} />
      <div>
        <h1>{book.title}</h1>
        {book.subtitle && <p className="subtitle">{book.subtitle}</p>}
        <p>{authors.map((a) => <Link key={a.id} href={`/autores/${a.slug}`}>{a.name}</Link>)}</p>
        {book.synopsis && <RichText data={book.synopsis} />}

        <div className="buy">
          {book.digitalEnabled && (
            <div>
              <h3>Digital</h3>
              <p>Ebook (EPUB + PDF) y audiolibro incluido</p>
              <p>
                {money(book.priceDigitalCLP, 'CLP')}
                {intl && book.priceDigitalUSD != null && ` · ${money(book.priceDigitalUSD, 'USD')}`}
              </p>
              <AddToCart bookId={book.id} title={book.title} format="digital" label="Comprar digital" />
            </div>
          )}
          {book.physicalEnabled && (
            <div>
              <h3>Físico (envíos en Chile)</h3>
              <p>Incluye ebook y audiolibro</p>
              <p>{money(book.pricePhysicalCLP, 'CLP')}</p>
              {book.fulfillment === 'stock' && (book.stock ?? 0) <= 10 && !outOfStock && <small>¡Últimos {book.stock} ejemplares!</small>}
              <AddToCart bookId={book.id} title={book.title} format="fisico" label={outOfStock ? 'Agotado' : 'Comprar físico'} disabled={outOfStock} />
            </div>
          )}
        </div>

        {sampleUrl && <p><a href={sampleUrl}>Leer muestra gratis (PDF)</a></p>}
        {yt && (
          <iframe
            className="video"
            src={`https://www.youtube-nocookie.com/embed/${yt}`}
            title={`Video de ${book.title}`}
            allowFullScreen
          />
        )}
      </div>
    </article>
  )
}
