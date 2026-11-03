import { headers as getHeaders } from 'next/headers'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import '../../styles/catalogo.css'
import { isStaff } from '@/access/roles'
import { AudioPlayer } from '@/components/AudioPlayer'
import { BookCover } from '@/components/catalogo/BookCover'
import { authorNames, formatBytes, formatDate, imageProps } from '@/components/catalogo/libro'
import { getPayloadClient } from '@/lib/payload'
import type { ProtectedFile } from '@/payload-types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Mi biblioteca', robots: { index: false, follow: false } }

const fileId = (f: number | { id: number } | null | undefined) => (f == null ? undefined : typeof f === 'object' ? f.id : f)
const fileDoc = (f: unknown) => (f && typeof f === 'object' ? (f as ProtectedFile) : null)

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 4v11" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 20h14" />
  </svg>
)

export default async function LibroComprado({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) redirect(`/cuenta/ingresar?volver=${encodeURIComponent(`/biblioteca/${slug}`)}`)

  const book = (
    await payload.find({ collection: 'books', where: { slug: { equals: slug } }, limit: 1, depth: 1, overrideAccess: true })
  ).docs[0]
  if (!book) notFound()
  const ent = (
    await payload.find({
      collection: 'entitlements',
      where: { and: [{ user: { equals: user.id } }, { book: { equals: book.id } }] },
      limit: 1,
      overrideAccess: true,
    })
  ).docs[0]
  // Sólo quien compró el libro (o el equipo) puede verlo.
  if (!ent && !isStaff(user)) notFound()

  const epub = fileDoc(book.epub)
  const pdf = fileDoc(book.pdf)
  const chapters = (book.audioChapters ?? [])
    .map((c) => ({ title: c.title, fileId: fileId(c.file)!, durationSec: c.durationSec ?? null }))
    .filter((c) => c.fileId)
  const progress = (ent?.audioProgress ?? undefined) as { chapter?: number; seconds?: number } | undefined
  const thumb = imageProps(book.cover, 'thumb')
  const authors = authorNames(book)
  const releaseDate = formatDate(book.publishedAt)

  return (
    <>
      <Link href="/biblioteca" className="cat-volver">
        <span aria-hidden="true">←</span> Mi biblioteca
      </Link>

      {!ent && (
        <p className="ficha-aviso" role="note">
          <strong>Vista del equipo.</strong> No tienes este libro en tu biblioteca: lo ves por tu rol, y el avance del audiolibro no se
          guarda.
        </p>
      )}

      <header className="biblio-cabecera">
        <BookCover book={book} size="thumb" sizes="132px" priority />
        <div>
          <p className="cat-eyebrow">En tu biblioteca</p>
          <h1>{book.title}</h1>
          {authors && <p>de {authors}</p>}
          <p>
            <Link href={`/libros/${book.slug}`}>Ver la ficha del libro</Link>
          </p>
        </div>
      </header>

      {!epub && !pdf && chapters.length === 0 && (
        <p className="compra-aviso biblio-aviso">
          {book.status === 'preventa' && releaseDate
            ? `Este libro se publica el ${releaseDate}. Ese día vas a encontrar aquí el ebook y el audiolibro.`
            : 'Estamos terminando de preparar los archivos de este libro. Muy pronto vas a encontrar aquí el ebook y el audiolibro.'}{' '}
          No necesitas hacer nada: ya es tuyo.
        </p>
      )}

      {(epub || pdf) && (
        <section className="cat-seccion" aria-labelledby="ebook">
          <h2 id="ebook">Ebook</h2>
          <div className="biblio-descargas">
            {epub && (
              <div className="descarga">
                <h3>EPUB</h3>
                <p>Para lectores electrónicos, celulares y tablets: el texto se adapta a tu pantalla.</p>
                {epub.filesize ? <p>{formatBytes(epub.filesize)}</p> : null}
                <a className="btn cat-btn-icono" href={`/api/descargas/${epub.id}`}>
                  <DownloadIcon /> Descargar EPUB
                </a>
              </div>
            )}
            {pdf && (
              <div className="descarga">
                <h3>PDF</h3>
                <p>Para leer en el computador o imprimir.</p>
                {pdf.filesize ? <p>{formatBytes(pdf.filesize)}</p> : null}
                <a className="btn cat-btn-icono" href={`/api/descargas/${pdf.id}`}>
                  <DownloadIcon /> Descargar PDF
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {chapters.length > 0 && (
        <section className="cat-seccion" aria-labelledby="audiolibro">
          <h2 id="audiolibro">Audiolibro</h2>
          <AudioPlayer
            bookId={book.id}
            bookTitle={book.title}
            authors={authors}
            cover={thumb ? { src: thumb.src, width: thumb.width, height: thumb.height } : undefined}
            chapters={chapters}
            start={progress}
            canSave={Boolean(ent)}
          />
        </section>
      )}
    </>
  )
}
