import Link from 'next/link'
import { BookCard } from '@/components/BookCard'
import { MothMark } from '@/components/Logo'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const payload = await getPayloadClient()
  const [featured, posts, settings] = await Promise.all([
    payload.find({ collection: 'books', where: { featured: { equals: true } }, limit: 3 }),
    payload.find({ collection: 'posts', sort: '-publishedAt', limit: 3 }),
    payload.findGlobal({ slug: 'site-settings' }),
  ])
  return (
    <>
      <section className="hero">
        <MothMark size={120} color="var(--gold)" />
        <h1>Editorial La Polilla</h1>
        <p>{settings.tagline}</p>
        <Link className="btn" href="/libros">Ver catálogo</Link>
      </section>
      <section>
        <h2>Destacados</h2>
        <div className="grid">{featured.docs.map((b) => <BookCard key={b.id} book={b} />)}</div>
      </section>
      {posts.docs.length > 0 && (
        <section>
          <h2>Noticias</h2>
          <ul>{posts.docs.map((p) => <li key={p.id}><Link href={`/blog/${p.slug}`}>{p.title}</Link></li>)}</ul>
        </section>
      )}
    </>
  )
}
