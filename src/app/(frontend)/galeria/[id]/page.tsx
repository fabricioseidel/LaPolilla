import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import '../../styles/catalogo.css'
import { galeriaItem } from '@/components/catalogo/galeria'
import { absoluteUrl } from '@/components/catalogo/libro'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

const getItem = cache(async (raw: string) => {
  const id = Number(raw)
  if (!Number.isInteger(id) || id <= 0) return null
  const payload = await getPayloadClient()
  const doc = await payload.findByID({ collection: 'illustrations', id, depth: 1 }).catch(() => null)
  return doc ? galeriaItem(doc) : null
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await getItem((await params).id)
  if (!item) return { title: 'Ilustración no encontrada' }
  const description = item.description || `${item.title}${item.artist ? `, por ${item.artist}` : ''}. Galería de Editorial La Polilla.`
  return {
    title: item.title,
    description,
    alternates: { canonical: absoluteUrl(`/galeria/${item.id}`) },
    openGraph: {
      title: item.title,
      description,
      images: [{ url: item.big.src, width: item.big.width, height: item.big.height, alt: item.big.alt }],
    },
  }
}

/** Página propia de cada ilustración: enlace compartible y versión sin JavaScript del visor. */
export default async function Ilustracion({ params }: Props) {
  const item = await getItem((await params).id)
  if (!item) notFound()

  // Anterior / siguiente en el mismo orden que la galería.
  const payload = await getPayloadClient()
  const { docs } = await payload.find({ collection: 'illustrations', sort: '-createdAt', pagination: false, depth: 0, select: { title: true } })
  const pos = docs.findIndex((d) => d.id === item.id)
  const prev = pos > 0 ? docs[pos - 1] : null
  const next = pos >= 0 && pos < docs.length - 1 ? docs[pos + 1] : null

  return (
    <>
      <Link href="/galeria" className="cat-volver">
        <span aria-hidden="true">←</span> Volver a la galería
      </Link>
      <article className="galeria-detalle">
        <figure>
          <img
            src={item.big.src}
            srcSet={item.big.srcSet}
            sizes="(min-width: 900px) 760px, 100vw"
            width={item.big.width}
            height={item.big.height}
            alt={item.big.alt}
            fetchPriority="high"
          />
        </figure>
        <div>
          <p className="cat-eyebrow">Ilustración</p>
          <h1>{item.title}</h1>
          {item.artist && <p>por {item.artist}</p>}
          {item.description && <p>{item.description}</p>}
          {item.book && (
            <p>
              Del libro <Link href={`/libros/${item.book.slug}`}>«{item.book.title}»</Link>
            </p>
          )}
          {(prev || next) && (
            <nav className="galeria-nav" aria-label="Otras ilustraciones">
              {prev && (
                <Link href={`/galeria/${prev.id}`} rel="prev">
                  <span aria-hidden="true">←</span> <span className="cat-sr">Anterior:</span> {prev.title}
                </Link>
              )}
              {next && (
                <Link href={`/galeria/${next.id}`} rel="next">
                  <span className="cat-sr">Siguiente:</span> {next.title} <span aria-hidden="true">→</span>
                </Link>
              )}
            </nav>
          )}
        </div>
      </article>
    </>
  )
}
