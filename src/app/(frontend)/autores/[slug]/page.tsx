import { RichText } from '@payloadcms/richtext-lexical/react'
import { notFound } from 'next/navigation'
import { BookCard } from '@/components/BookCard'
import { mediaUrl } from '@/lib/format'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayloadClient()
  const author = (await payload.find({ collection: 'authors', where: { slug: { equals: slug } }, limit: 1 })).docs[0]
  if (!author) notFound()
  const books = await payload.find({ collection: 'books', where: { authors: { contains: author.id } } })
  const photo = mediaUrl(author.photo, 'card')
  return (
    <article>
      {photo && <img className="author-photo" src={photo} alt={author.name} />}
      <h1>{author.name}</h1>
      {author.bio && <RichText data={author.bio} />}
      <div className="grid">{books.docs.map((b) => <BookCard key={b.id} book={b} />)}</div>
    </article>
  )
}
