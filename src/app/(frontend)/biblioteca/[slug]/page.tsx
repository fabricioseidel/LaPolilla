import { headers as getHeaders } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { AudioPlayer } from '@/components/AudioPlayer'
import { getPayloadClient } from '@/lib/payload'

const fileId = (f: number | { id: number } | null | undefined) => (f == null ? undefined : typeof f === 'object' ? f.id : f)

export default async function LibroComprado({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) redirect('/cuenta/ingresar')

  const book = (await payload.find({ collection: 'books', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
  if (!book) notFound()
  const ent = (
    await payload.find({ collection: 'entitlements', where: { and: [{ user: { equals: user.id } }, { book: { equals: book.id } }] }, limit: 1, overrideAccess: true })
  ).docs[0]
  if (!ent && user.role === 'cliente') notFound()

  const epub = fileId(book.epub)
  const pdf = fileId(book.pdf)
  const chapters = (book.audioChapters ?? []).map((c) => ({ title: c.title, fileId: fileId(c.file)! }))

  return (
    <section>
      <h1>{book.title}</h1>
      <h2>Descargar ebook</h2>
      <p>
        {epub && <a className="btn" href={`/api/descargas/${epub}`}>EPUB</a>}{' '}
        {pdf && <a className="btn" href={`/api/descargas/${pdf}`}>PDF</a>}
      </p>
      {chapters.length > 0 && (
        <>
          <h2>Audiolibro</h2>
          <AudioPlayer bookId={book.id} chapters={chapters} start={(ent?.audioProgress as { chapter?: number; seconds?: number }) ?? undefined} />
        </>
      )}
    </section>
  )
}
