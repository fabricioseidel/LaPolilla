import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { IconArrow } from '@/components/institucional/Icons'
import { NewsCard } from '@/components/institucional/NewsCard'
import { NewsletterForm } from '@/components/institucional/NewsletterForm'
import { RichTextContent } from '@/components/institucional/RichTextContent'
import { mediaUrl } from '@/lib/format'
import { issueFormToken } from '@/lib/institucional/form-server'
import { excerpt, hasRichText, plainText } from '@/lib/institucional/richtext'
import { formatDate } from '@/lib/institucional/site'
import { getPayloadClient } from '@/lib/payload'
import '../../styles/institucional.css'

export const dynamic = 'force-dynamic'

const PUBLISHED = { _status: { equals: 'published' } } as const

/** Noticia publicada por su URL (la misma consulta sirve para la página y sus metadatos). */
const getPost = cache(async (slug: string) => {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'posts',
    where: { and: [{ slug: { equals: slug } }, PUBLISHED] },
    limit: 1,
    depth: 2,
  })
  return res.docs[0]
})

const summaryOf = (post: NonNullable<Awaited<ReturnType<typeof getPost>>>) =>
  post.excerpt?.trim() || excerpt(plainText(post.content), 160)

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = await getPost((await params).slug)
  if (!post) return { title: 'Noticia no encontrada' }
  const image = mediaUrl(post.cover, 'hero')
  return {
    title: post.title,
    description: summaryOf(post),
    openGraph: {
      type: 'article',
      title: post.title,
      description: summaryOf(post),
      publishedTime: post.publishedAt ?? post.createdAt,
      images: image ? [image] : undefined,
    },
  }
}

export default async function Noticia({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  const payload = await getPayloadClient()
  const others = await payload.find({
    collection: 'posts',
    where: { and: [PUBLISHED, { id: { not_equals: post.id } }] },
    sort: '-publishedAt',
    limit: 2,
    depth: 1,
  })

  const date = post.publishedAt ?? post.createdAt
  const cover = post.cover && typeof post.cover === 'object' ? post.cover : null
  const coverUrl = mediaUrl(cover, 'hero')
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    datePublished: date,
    dateModified: post.updatedAt,
    description: summaryOf(post),
    image: coverUrl,
    publisher: { '@type': 'Organization', name: 'Editorial La Polilla' },
  }

  return (
    <article className="article">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <Link className="article-back" href="/blog">
        <IconArrow size={18} /> Todas las noticias
      </Link>
      <header className="article-header">
        <h1>{post.title}</h1>
        <p className="article-meta">
          <time dateTime={date}>{formatDate(date)}</time>
        </p>
      </header>

      {coverUrl && (
        <figure className="article-cover">
          <img src={coverUrl} alt={cover?.alt ?? ''} />
        </figure>
      )}
      {post.excerpt && <p className="article-lead">{post.excerpt}</p>}
      {hasRichText(post.content) && (
        <div className="article-body">
          <RichTextContent data={post.content} />
        </div>
      )}

      <footer className="article-footer">
        {others.docs.length > 0 && (
          <section aria-labelledby="mas-noticias">
            <h2 id="mas-noticias">Más noticias</h2>
            <ul className="news-grid">
              {others.docs.map((p) => (
                <li key={p.id}>
                  <NewsCard post={p} />
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className="inst-card" aria-labelledby="boletin-noticia" style={{ marginTop: others.docs.length ? 40 : 0 }}>
          <h2 id="boletin-noticia">Recibe las novedades en tu correo</h2>
          <NewsletterForm token={issueFormToken()} source="noticias" />
        </section>
      </footer>
    </article>
  )
}
