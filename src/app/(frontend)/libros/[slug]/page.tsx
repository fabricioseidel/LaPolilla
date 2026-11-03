import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import { headers as getHeaders } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache, Fragment } from 'react'
import '../../styles/catalogo.css'
import { isStaff } from '@/access/roles'
import { AddToCart } from '@/components/AddToCart'
import { BookCard } from '@/components/BookCard'
import { BookCover } from '@/components/catalogo/BookCover'
import {
  SITE_URL,
  VISIBLE_STATUSES,
  absoluteUrl,
  authorsOf,
  availability,
  cardSelect,
  formatBytes,
  formatDate,
  formatLongDuration,
  imageProps,
  listJoin,
  plainText,
  plural,
  visibleWhere,
} from '@/components/catalogo/libro'
import { money, youtubeId } from '@/lib/format'
import { getPayloadClient } from '@/lib/payload'
import { gateways } from '@/lib/payments/config'
import type { MediaPublicFile } from '@/payload-types'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

/** El público ve libros publicados o en preventa; el equipo además puede previsualizar borradores. */
const getBook = cache(async (slug: string) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'books',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  })
  const book = docs[0]
  if (!book) return null
  if (book.status && VISIBLE_STATUSES.includes(book.status)) return { book, preview: false }
  const { user } = await payload.auth({ headers: await getHeaders() })
  return isStaff(user) ? { book, preview: true } : null
})

const publicFile = (f: unknown) => (f && typeof f === 'object' && (f as MediaPublicFile).url ? (f as MediaPublicFile) : null)

function description(book: NonNullable<Awaited<ReturnType<typeof getBook>>>['book']) {
  const names = authorsOf(book).map((a) => a.name)
  return (
    plainText(book.synopsis, 160) ||
    `${book.title}${names.length ? `, de ${listJoin(names)}` : ''}: ebook con audiolibro incluido${
      book.physicalEnabled ? ' y edición impresa' : ''
    } en Editorial La Polilla.`
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await getBook((await params).slug)
  if (!found) return { title: 'Libro no encontrado' }
  const { book, preview } = found
  const url = absoluteUrl(`/libros/${book.slug}`)
  const img = imageProps(book.cover, 'card', `Portada de ${book.title}`)
  const desc = description(book)
  return {
    title: book.title,
    description: desc,
    alternates: { canonical: url },
    robots: preview ? { index: false, follow: false } : undefined,
    openGraph: {
      type: 'book',
      title: book.title,
      description: desc,
      url,
      siteName: 'Editorial La Polilla',
      locale: 'es_CL',
      images: img ? [{ url: img.src, width: img.width, height: img.height, alt: img.alt }] : undefined,
      isbn: book.isbn || undefined,
      releaseDate: book.publishedAt || undefined,
      authors: authorsOf(book).map((a) => absoluteUrl(`/autores/${a.slug}`)),
      tags: book.genres?.length ? book.genres : undefined,
    },
  }
}

const schemaAvailability = (s: 'InStock' | 'OutOfStock' | 'PreOrder') => `https://schema.org/${s}`

export default async function BookPage({ params }: Props) {
  const found = await getBook((await params).slug)
  if (!found) notFound()
  const { book, preview } = found
  const payload = await getPayloadClient()

  const authors = authorsOf(book)
  const a = availability(book)
  const intl = gateways().lemonsqueezy
  const url = absoluteUrl(`/libros/${book.slug}`)
  const releaseDate = formatDate(book.publishedAt)
  const yt = youtubeId(book.trailerYoutube)
  const sample = publicFile(book.sample)
  const audioSample = publicFile(book.audioSample)
  const chapters = book.audioChapters ?? []
  const totalSec = chapters.length && chapters.every((c) => c.durationSec) ? chapters.reduce((s, c) => s + (c.durationSec ?? 0), 0) : 0

  const priceCLP = book.priceDigitalCLP
  const priceUSD = intl ? book.priceDigitalUSD : null
  const digitalBuyable = a.digital && (priceCLP != null || priceUSD != null)
  const physicalBuyable = a.physical != null && a.physical !== 'agotado' && book.pricePhysicalCLP != null
  const physicalText = {
    disponible: 'Disponible',
    ultimos: a.stock === 1 ? '¡Queda 1 ejemplar!' : `¡Quedan ${a.stock} ejemplares!`,
    agotado: 'Agotado',
    pod: 'Impresión bajo demanda: se imprime especialmente para ti',
  }

  const more =
    authors.length > 0
      ? (
          await payload.find({
            collection: 'books',
            where: { and: [visibleWhere, { authors: { in: authors.map((x) => x.id) } }, { id: { not_equals: book.id } }] },
            sort: '-publishedAt',
            limit: 4,
            depth: 1,
            select: cardSelect,
            populate: { authors: { name: true, slug: true } },
          })
        ).docs
      : []

  // Datos estructurados (schema.org/Book) con una oferta por formato.
  const cover = imageProps(book.cover, 'card')
  const offers: Record<string, unknown>[] = []
  if (a.digital && priceCLP != null)
    offers.push({
      '@type': 'Offer',
      name: 'Digital: EPUB + PDF + audiolibro',
      price: priceCLP,
      priceCurrency: 'CLP',
      availability: schemaAvailability(a.preventa ? 'PreOrder' : 'InStock'),
      url,
    })
  if (a.digital && priceUSD != null)
    offers.push({
      '@type': 'Offer',
      name: 'Digital: EPUB + PDF + audiolibro (fuera de Chile)',
      price: priceUSD,
      priceCurrency: 'USD',
      availability: schemaAvailability(a.preventa ? 'PreOrder' : 'InStock'),
      url,
    })
  if (a.physical && book.pricePhysicalCLP != null)
    offers.push({
      '@type': 'Offer',
      name: 'Físico (incluye ebook y audiolibro)',
      price: book.pricePhysicalCLP,
      priceCurrency: 'CLP',
      availability: schemaAvailability(a.preventa ? 'PreOrder' : a.physical === 'agotado' ? 'OutOfStock' : 'InStock'),
      itemCondition: 'https://schema.org/NewCondition',
      eligibleRegion: { '@type': 'Country', name: 'CL' },
      url,
    })
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    url,
    inLanguage: 'es',
    ...(book.subtitle ? { alternativeHeadline: book.subtitle } : {}),
    ...(book.isbn ? { isbn: book.isbn } : {}),
    ...(book.pages ? { numberOfPages: book.pages } : {}),
    ...(book.publishedAt ? { datePublished: book.publishedAt.slice(0, 10) } : {}),
    ...(book.genres?.length ? { genre: book.genres } : {}),
    ...(cover ? { image: absoluteUrl(cover.src) } : {}),
    description: description(book),
    author: authors.map((x) => ({ '@type': 'Person', name: x.name, url: absoluteUrl(`/autores/${x.slug}`) })),
    publisher: { '@type': 'Organization', name: 'Editorial La Polilla', url: SITE_URL },
    ...(offers.length ? { offers } : {}),
  }

  const authorLinks = authors.map((x, i) => (
    <Fragment key={x.id}>
      {i > 0 && (i === authors.length - 1 ? ' y ' : ', ')}
      <Link href={`/autores/${x.slug}`}>{x.name}</Link>
    </Fragment>
  ))

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      {preview && (
        <p className="ficha-aviso" role="note">
          <strong>Vista previa del equipo.</strong> Este libro está en borrador: el público todavía no lo ve en el sitio.
        </p>
      )}
      <Link href="/libros" className="cat-volver">
        <span aria-hidden="true">←</span> Volver al catálogo
      </Link>

      <article className="ficha">
        <div className="ficha-portada">
          <BookCover book={book} size="card" sizes="(min-width: 880px) 360px, 280px" priority />
        </div>

        <div className="ficha-info">
          {book.genres?.length ? <p className="cat-eyebrow">{book.genres.join(' · ')}</p> : null}
          <h1 className="ficha-titulo">{book.title}</h1>
          {book.subtitle && <p className="ficha-subtitulo">{book.subtitle}</p>}
          {authors.length > 0 && <p className="ficha-autoria">de {authorLinks}</p>}
          {(a.preventa || a.physical === 'ultimos' || a.physical === 'agotado') && (
            <ul className="cat-chips" aria-label="Disponibilidad">
              {a.preventa && <li className="cat-chip cat-chip--preventa">Preventa</li>}
              {a.physical === 'ultimos' && <li className="cat-chip cat-chip--ultimos">Últimos ejemplares</li>}
              {a.physical === 'agotado' && <li className="cat-chip cat-chip--agotado">Físico agotado</li>}
            </ul>
          )}

          <section className="compra" aria-labelledby="compra-titulo">
            <h2 id="compra-titulo" className="cat-eyebrow">
              Elige tu formato
            </h2>
            {a.preventa && (
              <p className="compra-aviso">
                <strong>Preventa.</strong> {releaseDate ? `Este libro se publica el ${releaseDate}.` : 'Este libro se publica muy pronto.'}{' '}
                Puedes comprarlo desde ya: llegará a tu biblioteca cuando se publique.
              </p>
            )}
            {!a.digital && !a.physical ? (
              <p className="compra-aviso">Este libro todavía no está a la venta. Vuelve pronto.</p>
            ) : (
              <div className="compra-opciones">
                {a.digital && (
                  <div className="compra-opcion">
                    <h3>Digital</h3>
                    <p className="compra-incluye">EPUB + PDF + audiolibro</p>
                    {priceCLP != null && <p className="compra-precio">{money(priceCLP, 'CLP')}</p>}
                    {priceUSD != null && <p className="compra-precio-alt">Fuera de Chile: US{money(priceUSD, 'USD')}</p>}
                    <p className="compra-incluye">Lo lees y escuchas en Mi biblioteca, desde cualquier país.</p>
                    <AddToCart
                      bookId={book.id}
                      title={book.title}
                      format="digital"
                      disabled={!digitalBuyable}
                      label={digitalBuyable ? undefined : 'Pronto disponible'}
                    />
                  </div>
                )}
                {a.physical && (
                  <div className="compra-opcion">
                    <h3>Físico</h3>
                    <p className="compra-incluye">Incluye ebook y audiolibro · envío sólo dentro de Chile</p>
                    {book.pricePhysicalCLP != null && (
                      <p className="compra-precio">
                        {money(book.pricePhysicalCLP, 'CLP')} <small>+ envío</small>
                      </p>
                    )}
                    <p className={`compra-estado compra-estado--${a.physical}`}>{physicalText[a.physical]}</p>
                    {a.physical === 'agotado' && a.digital && (
                      <p className="compra-incluye">La versión digital, con su audiolibro, sigue disponible.</p>
                    )}
                    <AddToCart
                      bookId={book.id}
                      title={book.title}
                      format="fisico"
                      disabled={!physicalBuyable}
                      label={a.physical === 'agotado' ? 'Agotado' : physicalBuyable ? undefined : 'Pronto disponible'}
                      max={a.stock != null ? Math.min(a.stock, 10) : 10}
                    />
                  </div>
                )}
              </div>
            )}
          </section>

          {book.synopsis && (
            <section className="ficha-seccion" aria-labelledby="sinopsis">
              <h2 id="sinopsis">Sinopsis</h2>
              <div className="ficha-sinopsis">
                <RichText data={book.synopsis} />
              </div>
            </section>
          )}

          {(sample || audioSample) && (
            <section className="ficha-seccion" aria-labelledby="muestras">
              <h2 id="muestras">Pruébalo gratis</h2>
              <div className="ficha-muestras">
                {sample && (
                  <div className="muestra">
                    <h3>Lee las primeras páginas</h3>
                    <p>Muestra gratuita en PDF{sample.filesize ? ` · ${formatBytes(sample.filesize)}` : ''}</p>
                    <a className="btn secondary cat-btn-icono" href={sample.url!} target="_blank" rel="noopener">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v17H6.5A2.5 2.5 0 0 0 4 22.5z" />
                        <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v17h5.5a2.5 2.5 0 0 1 2.5 2.5z" />
                      </svg>
                      Abrir la muestra <span className="cat-sr">(PDF, se abre en otra pestaña)</span>
                    </a>
                  </div>
                )}
                {audioSample && (
                  <div className="muestra">
                    <h3 id="muestra-audio">Escucha un fragmento</h3>
                    <p>Un adelanto del audiolibro, sin necesidad de comprar.</p>
                    <audio controls preload="none" src={audioSample.url!} aria-labelledby="muestra-audio">
                      <a href={audioSample.url!}>Descargar el fragmento de audio</a>
                    </audio>
                  </div>
                )}
              </div>
            </section>
          )}

          {yt && (
            <section className="ficha-seccion ficha-video" aria-labelledby="video">
              <h2 id="video">Video</h2>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${yt}`}
                title={`Video de ${book.title} en YouTube`}
                loading="lazy"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </section>
          )}

          <section className="ficha-seccion" aria-labelledby="ficha-tecnica">
            <h2 id="ficha-tecnica">Ficha técnica</h2>
            <dl className="ficha-tecnica">
              {authors.length > 0 && (
                <>
                  <dt>Autoría</dt>
                  <dd>{authorLinks}</dd>
                </>
              )}
              {book.isbn && (
                <>
                  <dt>ISBN</dt>
                  <dd>{book.isbn}</dd>
                </>
              )}
              {book.pages ? (
                <>
                  <dt>Páginas</dt>
                  <dd>{book.pages}</dd>
                </>
              ) : null}
              {releaseDate && (
                <>
                  <dt>Publicación</dt>
                  <dd>
                    <time dateTime={book.publishedAt!.slice(0, 10)}>{releaseDate}</time>
                  </dd>
                </>
              )}
              {book.genres?.length ? (
                <>
                  <dt>{book.genres.length === 1 ? 'Género' : 'Géneros'}</dt>
                  <dd>
                    {book.genres.map((g, i) => (
                      <Fragment key={g}>
                        {i > 0 && ', '}
                        <Link href={`/libros?genero=${encodeURIComponent(g)}`}>{g}</Link>
                      </Fragment>
                    ))}
                  </dd>
                </>
              ) : null}
              <dt>Formatos</dt>
              <dd>{listJoin([a.digital ? 'Digital (EPUB, PDF y audiolibro)' : '', a.physical ? 'Físico' : ''].filter(Boolean)) || 'Próximamente'}</dd>
              {chapters.length > 0 && (
                <>
                  <dt>Audiolibro</dt>
                  <dd>
                    {plural(chapters.length, 'capítulo')}
                    {totalSec ? ` · ${formatLongDuration(totalSec)}` : ''}
                  </dd>
                </>
              )}
              <dt>Editorial</dt>
              <dd>Editorial La Polilla</dd>
            </dl>
          </section>
        </div>
      </article>

      {more.length > 0 && (
        <section className="cat-seccion" aria-labelledby="mas-autoria">
          <div className="cat-seccion-cabecera">
            <h2 id="mas-autoria">{authors.length === 1 ? `Más de ${authors[0].name}` : 'Más de esta autoría'}</h2>
            {authors.length === 1 && (
              <Link className="cat-enlace-flecha" href={`/autores/${authors[0].slug}`}>
                Conoce a {authors[0].name} <span aria-hidden="true">→</span>
              </Link>
            )}
          </div>
          <ul className="libro-grid">
            {more.map((b) => (
              <li key={b.id}>
                <BookCard book={b} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
