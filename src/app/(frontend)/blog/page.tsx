import Link from 'next/link'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Noticias' }

export default async function Blog() {
  const payload = await getPayloadClient()
  const posts = await payload.find({ collection: 'posts', sort: '-publishedAt' })
  return (
    <section>
      <h1>Noticias</h1>
      {posts.docs.map((p) => (
        <article key={p.id}>
          <h2><Link href={`/blog/${p.slug}`}>{p.title}</Link></h2>
          <p>{p.excerpt}</p>
        </article>
      ))}
    </section>
  )
}
