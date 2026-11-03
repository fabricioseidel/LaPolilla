import Link from 'next/link'
import '../styles/catalogo.css'
import { AuthorPhoto } from '@/components/catalogo/AuthorPhoto'
import { plainText, plural, visibleWhere } from '@/components/catalogo/libro'
import { MothMark } from '@/components/Logo'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Autoras y autores',
  description: 'Conoce a quienes escriben los libros de Editorial La Polilla.',
}

export default async function Autores() {
  const payload = await getPayloadClient()
  const [authors, books] = await Promise.all([
    payload.find({ collection: 'authors', sort: 'name', pagination: false, depth: 1 }),
    payload.find({ collection: 'books', where: visibleWhere, pagination: false, depth: 0, select: { authors: true } }),
  ])

  // Cuántos libros visibles tiene cada autora.
  const count = new Map<number, number>()
  for (const b of books.docs)
    for (const a of b.authors ?? []) {
      const id = typeof a === 'object' ? a.id : a
      count.set(id, (count.get(id) ?? 0) + 1)
    }

  return (
    <section>
      <header className="cat-encabezado">
        <p className="cat-eyebrow">Autoría</p>
        <h1>Autoras y autores</h1>
        <p>Las voces detrás de cada libro: quiénes son, qué escriben y dónde seguirles la pista.</p>
      </header>

      {authors.docs.length === 0 ? (
        <div className="cat-vacio">
          <MothMark size={88} color="var(--gold)" />
          <h2>Pronto vas a conocerlas</h2>
          <p>Estamos preparando las presentaciones de nuestras autoras y autores. Mientras tanto, puedes recorrer el catálogo.</p>
          <div className="cat-vacio-acciones">
            <Link className="btn" href="/libros">
              Ver libros
            </Link>
          </div>
        </div>
      ) : (
        <ul className="autoras-grid">
          {authors.docs.map((a, i) => {
            const n = count.get(a.id) ?? 0
            const bio = plainText(a.bio, 130)
            return (
              <li key={a.id}>
                <article className="autora-card">
                  <AuthorPhoto author={a} priority={i < 6} />
                  <div>
                    <h2>
                      <Link className="autora-card-enlace" href={`/autores/${a.slug}`}>
                        {a.name}
                      </Link>
                    </h2>
                    <p className="autora-card-libros">{n ? plural(n, 'libro') : 'Pronto en La Polilla'}</p>
                    {bio && <p>{bio}</p>}
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
