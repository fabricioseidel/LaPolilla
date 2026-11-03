import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import '../../styles/catalogo.css'
import { BookCard } from '@/components/BookCard'
import { AuthorPhoto } from '@/components/catalogo/AuthorPhoto'
import { absoluteUrl, cardSelect, imageProps, plainText, safeHref, visibleWhere } from '@/components/catalogo/libro'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

const getAuthor = cache(async (slug: string) => {
  const payload = await getPayloadClient()
  return (await payload.find({ collection: 'authors', where: { slug: { equals: slug } }, limit: 1, depth: 1 })).docs[0] ?? null
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const author = await getAuthor((await params).slug)
  if (!author) return { title: 'Autoría no encontrada' }
  const description = plainText(author.bio, 160) || `Libros de ${author.name} en Editorial La Polilla.`
  const img = imageProps(author.photo, 'card', `Foto de ${author.name}`)
  return {
    title: author.name,
    description,
    alternates: { canonical: absoluteUrl(`/autores/${author.slug}`) },
    openGraph: {
      type: 'profile',
      title: author.name,
      description,
      url: absoluteUrl(`/autores/${author.slug}`),
      images: img ? [{ url: img.src, width: img.width, height: img.height, alt: img.alt }] : undefined,
    },
  }
}

const ExternalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 4h6v6" />
    <path d="M20 4 11 13" />
    <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </svg>
)

export default async function AuthorPage({ params }: Props) {
  const author = await getAuthor((await params).slug)
  if (!author) notFound()
  const payload = await getPayloadClient()
  const books = await payload.find({
    collection: 'books',
    where: { and: [visibleWhere, { authors: { in: [author.id] } }] },
    sort: '-publishedAt',
    pagination: false,
    depth: 1,
    select: cardSelect,
    populate: { authors: { name: true, slug: true } },
  })
  const links = (author.links ?? []).map((l) => ({ ...l, href: safeHref(l.url) })).filter((l) => l.href)
  const photo = imageProps(author.photo, 'card')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    url: absoluteUrl(`/autores/${author.slug}`),
    ...(photo ? { image: absoluteUrl(photo.src) } : {}),
    ...(links.length ? { sameAs: links.map((l) => l.href) } : {}),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <Link href="/autores" className="cat-volver">
        <span aria-hidden="true">←</span> Autoras y autores
      </Link>

      <article className="autora-perfil">
        <AuthorPhoto author={author} size="card" sizes="200px" priority />
        <div>
          <p className="cat-eyebrow">Autoría</p>
          <h1>{author.name}</h1>
          {author.bio && (
            <div className="autora-bio">
              <RichText data={author.bio} />
            </div>
          )}
          {links.length > 0 && (
            <ul className="autora-redes" aria-label={`Redes de ${author.name}`}>
              {links.map((l) => (
                <li key={l.id ?? l.href}>
                  <a href={l.href} rel="noopener">
                    {l.label}
                    <ExternalIcon />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </article>

      <section className="cat-seccion" aria-labelledby="sus-libros">
        <h2 id="sus-libros">{books.docs.length === 1 ? 'Su libro' : 'Sus libros'}</h2>
        {books.docs.length === 0 ? (
          <p className="cat-vacio">Muy pronto vas a encontrar aquí sus libros.</p>
        ) : (
          <ul className="libro-grid">
            {books.docs.map((b, i) => (
              <li key={b.id}>
                <BookCard book={b} priority={i < 4} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
