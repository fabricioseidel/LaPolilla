import Link from 'next/link'
import { mediaUrl } from '@/lib/format'
import { formatDate } from '@/lib/institucional/site'
import type { Post } from '@/payload-types'
import { MothMark } from '../Logo'

/** Tarjeta de noticia: imagen, fecha, título y resumen. Toda la tarjeta es clicable, pero hay un solo enlace. */
export function NewsCard({ post, headingLevel = 3 }: { post: Post; headingLevel?: 2 | 3 }) {
  const img = mediaUrl(post.cover, 'card')
  const alt = (post.cover && typeof post.cover === 'object' && post.cover.alt) || ''
  const date = post.publishedAt ?? post.createdAt
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  return (
    <article className="news-card">
      <div className="news-card-media">
        {img ? <img src={img} alt={alt} loading="lazy" /> : <MothMark size={72} color="var(--indigo-2)" />}
      </div>
      <div className="news-card-body">
        <time dateTime={date}>{formatDate(date)}</time>
        <Heading>
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </Heading>
        {post.excerpt && <p>{post.excerpt}</p>}
        <span className="news-card-more" aria-hidden="true">
          Leer noticia
        </span>
      </div>
    </article>
  )
}
