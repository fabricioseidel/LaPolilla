import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { NewsCard } from '@/components/institucional/NewsCard'
import { NewsletterForm } from '@/components/institucional/NewsletterForm'
import { MothMark } from '@/components/Logo'
import { issueFormToken } from '@/lib/institucional/form-server'
import { getPayloadClient } from '@/lib/payload'
import '../styles/institucional.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Noticias',
  description: 'Lanzamientos, presentaciones y novedades de Editorial La Polilla.',
}

const PER_PAGE = 12

export default async function Blog({ searchParams }: { searchParams: Promise<{ pagina?: string }> }) {
  const { pagina } = await searchParams
  const page = Math.max(1, Number.parseInt(pagina ?? '1', 10) || 1)
  const payload = await getPayloadClient()
  // Sólo noticias publicadas, aunque quien mire sea del equipo (el panel muestra los borradores).
  const posts = await payload.find({
    collection: 'posts',
    where: { _status: { equals: 'published' } },
    sort: '-publishedAt',
    limit: PER_PAGE,
    page,
    depth: 1,
  })
  if (page > 1 && !posts.docs.length) notFound()

  return (
    <>
      <header className="inst-page-head">
        <p className="inst-eyebrow">Diario de la editorial</p>
        <h1>Noticias</h1>
        <p className="inst-lead">Lanzamientos, presentaciones, lecturas y lo que va pasando en La Polilla.</p>
      </header>

      {posts.docs.length > 0 ? (
        <>
          <ul className="news-grid">
            {posts.docs.map((p) => (
              <li key={p.id}>
                <NewsCard post={p} headingLevel={2} />
              </li>
            ))}
          </ul>
          {posts.totalPages > 1 && (
            <nav className="inst-pagination" aria-label="Páginas de noticias">
              {posts.hasPrevPage ? (
                <Link className="btn secondary" href={posts.prevPage === 1 ? '/blog' : `/blog?pagina=${posts.prevPage}`}>
                  Noticias más recientes
                </Link>
              ) : (
                <span />
              )}
              <p>
                Página {posts.page} de {posts.totalPages}
              </p>
              {posts.hasNextPage ? (
                <Link className="btn secondary" href={`/blog?pagina=${posts.nextPage}`}>
                  Noticias anteriores
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </>
      ) : (
        <div className="inst-empty">
          <MothMark size={64} />
          <h2>Todavía no hay noticias</h2>
          <p>
            Muy pronto contaremos aquí los lanzamientos, las presentaciones y las novedades de la editorial. Inscríbete en el boletín y
            te avisaremos.
          </p>
          <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'left' }}>
            <NewsletterForm token={issueFormToken()} source="noticias" />
          </div>
        </div>
      )}
    </>
  )
}
