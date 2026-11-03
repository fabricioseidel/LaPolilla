import Link from 'next/link'
import type { ReactNode } from 'react'
import { IconArrow, IconHeadphones, IconPackage, IconTablet } from '@/components/institucional/Icons'
import { NewsCard } from '@/components/institucional/NewsCard'
import { NewsletterForm } from '@/components/institucional/NewsletterForm'
import { SocialLinks } from '@/components/institucional/SocialLinks'
import { MothMark } from '@/components/Logo'
import { mediaUrl, money } from '@/lib/format'
import { issueFormToken } from '@/lib/institucional/form-server'
import { excerpt, plainText } from '@/lib/institucional/richtext'
import { socialLinks } from '@/lib/institucional/site'
import { getPayloadClient } from '@/lib/payload'
import type { Author, Book } from '@/payload-types'
import './styles/institucional.css'

export const dynamic = 'force-dynamic'

/** Libros visibles en el sitio (los borradores no se muestran). */
const VISIBLE = { status: { in: ['publicado', 'preventa'] } }

const BOOK_FIELDS = {
  title: true,
  subtitle: true,
  slug: true,
  authors: true,
  cover: true,
  synopsis: true,
  status: true,
  featured: true,
  digitalEnabled: true,
  priceDigitalCLP: true,
  physicalEnabled: true,
  pricePhysicalCLP: true,
  fulfillment: true,
  stock: true,
  publishedAt: true,
  createdAt: true,
} as const

type FeaturedBook = Pick<
  Book,
  | 'id'
  | 'title'
  | 'subtitle'
  | 'slug'
  | 'authors'
  | 'cover'
  | 'synopsis'
  | 'status'
  | 'featured'
  | 'digitalEnabled'
  | 'priceDigitalCLP'
  | 'physicalEnabled'
  | 'pricePhysicalCLP'
  | 'fulfillment'
  | 'stock'
  | 'publishedAt'
  | 'createdAt'
>

/** El primer libro marcado como destacado; si no hay, el último publicado (fecha de publicación o de creación). */
function pickFeatured(books: FeaturedBook[]) {
  const time = (b: FeaturedBook) => Date.parse(b.publishedAt ?? b.createdAt) || 0
  const sorted = [...books].sort((a, b) => time(b) - time(a))
  return sorted.find((b) => b.featured) ?? sorted[0]
}

const physicalAvailable = (b: FeaturedBook) =>
  b.physicalEnabled !== false && !(b.fulfillment === 'stock' && (b.stock ?? 0) <= 0)

function priceFrom(b: FeaturedBook) {
  const prices = [
    b.digitalEnabled !== false ? b.priceDigitalCLP : null,
    physicalAvailable(b) ? b.pricePhysicalCLP : null,
  ].filter((n): n is number => typeof n === 'number' && n > 0)
  return prices.length ? Math.min(...prices) : null
}

/** «de Ana, Luis y Marta», con enlace a cada ficha. */
function AuthorLinks({ authors }: { authors: Author[] }) {
  return (
    <>
      de{' '}
      {authors.map((a, i) => (
        <span key={a.id}>
          {i > 0 && (i === authors.length - 1 ? ' y ' : ', ')}
          {a.slug ? <Link href={`/autores/${a.slug}`}>{a.name}</Link> : a.name}
        </span>
      ))}
    </>
  )
}

function Featured({ book }: { book?: FeaturedBook }) {
  if (!book)
    return (
      <section className="home-featured" aria-labelledby="destacado">
        <div className="home-featured-cover">
          <div className="home-cover-placeholder">
            <MothMark size={96} color="var(--gold)" />
            <span>Próximamente</span>
          </div>
        </div>
        <div className="home-featured-body">
          <p className="inst-eyebrow">Libro destacado</p>
          <h2 id="destacado">El primer libro está en camino</h2>
          <p className="home-featured-synopsis">
            Estamos afinando los últimos detalles. Inscríbete en el boletín y te avisaremos apenas esté disponible: en digital, en
            papel y en audiolibro.
          </p>
          <div className="inst-actions">
            <a className="btn" href="#boletin">
              Avísame cuando salga
            </a>
            <Link className="btn secondary" href="/nosotros">
              Conoce la editorial
            </Link>
          </div>
        </div>
      </section>
    )

  const authors = (book.authors ?? []).filter((a): a is Author => typeof a === 'object' && a !== null)
  const cover = mediaUrl(book.cover, 'card')
  const synopsis = excerpt(plainText(book.synopsis), 260)
  const from = priceFrom(book)
  const href = `/libros/${book.slug}`
  const formats = [
    book.digitalEnabled !== false && 'EPUB + PDF',
    'Audiolibro incluido',
    physicalAvailable(book) && 'Libro impreso',
  ].filter(Boolean) as string[]

  return (
    <section className="home-featured" aria-labelledby="destacado">
      <Link href={href} className="home-featured-cover" tabIndex={-1} aria-hidden="true">
        {cover ? (
          <img src={cover} alt="" />
        ) : (
          <div className="home-cover-placeholder">
            <MothMark size={96} color="var(--gold)" />
            <span>{book.title}</span>
          </div>
        )}
      </Link>
      <div className="home-featured-body">
        <div className="home-featured-tags">
          <p className="inst-eyebrow">Libro destacado</p>
          {book.status === 'preventa' && <span className="tag">Preventa</span>}
        </div>
        <h2 id="destacado">
          <Link href={href}>{book.title}</Link>
        </h2>
        {book.subtitle && <p className="home-featured-subtitle">{book.subtitle}</p>}
        {authors.length > 0 && (
          <p className="home-featured-authors">
            <AuthorLinks authors={authors} />
          </p>
        )}
        {synopsis && <p className="home-featured-synopsis">{synopsis}</p>}
        <ul className="home-formats" aria-label="Formatos">
          {formats.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        {from != null && (
          <p className="home-price">
            <span>Desde</span> <strong>{money(from, 'CLP')}</strong>
            <small>Precio en pesos chilenos, IVA incluido.</small>
          </p>
        )}
        <Link className="btn" href={href}>
          Ver el libro <IconArrow size={18} />
        </Link>
      </div>
    </section>
  )
}

const STEPS: { icon: ReactNode; title: string; text: string; tag: string }[] = [
  {
    icon: <IconTablet size={28} />,
    title: 'Digital: EPUB + PDF',
    text: 'Apenas pagas, el ebook queda en Mi biblioteca en EPUB y en PDF. Lo descargas cuando quieras, desde cualquier dispositivo.',
    tag: 'A todo el mundo',
  },
  {
    icon: <IconHeadphones size={28} />,
    title: 'Audiolibro incluido',
    text: 'Cualquier compra, digital o en papel, trae el audiolibro. Lo escuchas en línea desde Mi biblioteca y retoma donde quedaste.',
    tag: 'Con cualquier compra',
  },
  {
    icon: <IconPackage size={28} />,
    title: 'Libro físico',
    text: 'Te enviamos el libro impreso a la región donde estés. Y, como toda compra, incluye el ebook y el audiolibro.',
    tag: 'Envíos a todo Chile',
  },
]

/** Cielo nocturno decorativo detrás de la polilla. */
function Stars() {
  const stars = [
    [70, 60, 1.6], [160, 210, 1.1], [250, 90, 2], [330, 300, 1.2], [120, 380, 1.5], [420, 140, 1],
    [610, 70, 1.3], [700, 260, 1.8], [790, 120, 1.1], [880, 330, 1.5], [930, 70, 2], [560, 380, 1.1], [40, 250, 1],
  ]
  return (
    <svg className="home-stars" viewBox="0 0 1000 440" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      {stars.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={i % 3 ? 'var(--moon)' : 'var(--lilac)'} opacity={i % 2 ? 0.35 : 0.55} />
      ))}
    </svg>
  )
}

export default async function Home() {
  const payload = await getPayloadClient()
  const [books, posts, settings] = await Promise.all([
    payload.find({ collection: 'books', where: VISIBLE, depth: 1, limit: 50, select: BOOK_FIELDS }),
    payload.find({ collection: 'posts', where: { _status: { equals: 'published' } }, sort: '-publishedAt', limit: 3, depth: 1 }),
    payload.findGlobal({ slug: 'site-settings', depth: 0 }),
  ])
  const featured = pickFeatured(books.docs as FeaturedBook[])
  const social = socialLinks(settings)
  const token = issueFormToken()

  return (
    <>
      <section className="home-hero" aria-labelledby="titulo-portada">
        <Stars />
        <div className="home-moth">
          <MothMark size={220} color="var(--gold)" />
        </div>
        <h1 id="titulo-portada">Editorial La Polilla</h1>
        {settings.tagline && <p className="home-tagline">{settings.tagline}</p>}
        <p className="home-intro">
          Somos una editorial chilena pequeña. Publicamos libros para leer y escuchar: en digital, en papel y en audiolibro.
        </p>
        <div className="inst-actions">
          {featured ? (
            <Link className="btn" href="/libros">
              Explorar los libros
            </Link>
          ) : (
            <a className="btn" href="#boletin">
              Recibir novedades
            </a>
          )}
          <Link className="btn secondary" href="/nosotros">
            Conoce la editorial
          </Link>
        </div>
      </section>

      <Featured book={featured} />

      <section className="inst-section" aria-labelledby="como-funciona">
        <div className="inst-section-head">
          <div>
            <h2 id="como-funciona">Cómo funciona</h2>
            <p>Elige cómo quieres leer. Todo lo que compras queda guardado en tu cuenta, en Mi biblioteca.</p>
          </div>
          <Link className="inst-more" href="/preguntas-frecuentes">
            Preguntas frecuentes <IconArrow size={18} />
          </Link>
        </div>
        <ul className="home-steps">
          {STEPS.map((s) => (
            <li key={s.title} className="inst-card home-step">
              <span className="home-step-icon">{s.icon}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
              <p className="home-step-tag">{s.tag}</p>
            </li>
          ))}
        </ul>
        <p className="home-steps-note">
          Para comprar necesitas una cuenta: así tus libros y audiolibros te esperan siempre en{' '}
          <Link href="/biblioteca">Mi biblioteca</Link>.
        </p>
      </section>

      <section className="inst-section" aria-labelledby="noticias">
        <div className="inst-section-head">
          <h2 id="noticias">Noticias</h2>
          {posts.docs.length > 0 && (
            <Link className="inst-more" href="/blog">
              Ver todas las noticias <IconArrow size={18} />
            </Link>
          )}
        </div>
        {posts.docs.length > 0 ? (
          <ul className="news-grid">
            {posts.docs.map((p) => (
              <li key={p.id}>
                <NewsCard post={p} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="inst-empty">
            <MothMark size={56} />
            <h3>Pronto habrá novedades</h3>
            <p>Aquí contaremos los lanzamientos, las presentaciones y lo que pasa en la editorial. Mientras tanto, inscríbete en el boletín.</p>
          </div>
        )}
      </section>

      <section id="boletin" className="inst-section home-newsletter" aria-labelledby="boletin-titulo">
        <div className="home-newsletter-copy">
          <h2 id="boletin-titulo">Boletín de La Polilla</h2>
          <p>Te escribiremos cuando haya un libro nuevo, una preventa o una presentación. Sólo cuando valga la pena.</p>
          {social.length > 0 && (
            <div className="home-follow">
              <p>También nos encuentras en</p>
              <SocialLinks links={social} />
            </div>
          )}
        </div>
        <NewsletterForm token={token} source="inicio" />
      </section>
    </>
  )
}
