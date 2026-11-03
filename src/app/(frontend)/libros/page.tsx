import Form from 'next/form'
import Link from 'next/link'
import '../styles/catalogo.css'
import { BookCard } from '@/components/BookCard'
import { authorsOf, availability, cardSelect, normalize, plural, visibleWhere } from '@/components/catalogo/libro'
import { MothMark } from '@/components/Logo'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Libros',
  description: 'Catálogo de Editorial La Polilla: ebooks con audiolibro incluido y libros impresos con envío dentro de Chile.',
}

const PAGE_SIZE = 24
type Params = Record<string, string | string[] | undefined>
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''

export default async function Catalogo({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams
  const q = first(sp.q).trim().slice(0, 100)
  const genero = first(sp.genero).trim()
  const formato = ['digital', 'fisico'].includes(first(sp.formato)) ? (first(sp.formato) as 'digital' | 'fisico') : ''
  const orden = first(sp.orden) === 'titulo' ? 'titulo' : 'recientes'
  const pedida = Math.max(1, Number.parseInt(first(sp.pagina), 10) || 1)

  const payload = await getPayloadClient()
  // El catálogo de una editorial pequeña cabe en una consulta: así la búsqueda
  // ignora tildes y mayúsculas, y los géneros del filtro salen de los mismos libros.
  const { docs } = await payload.find({
    collection: 'books',
    where: visibleWhere,
    pagination: false,
    depth: 1,
    select: { ...cardSelect, subtitle: true, genres: true, publishedAt: true, createdAt: true },
    populate: { authors: { name: true, slug: true } },
  })

  const generos = [...new Map(docs.flatMap((b) => b.genres ?? []).map((g) => [normalize(g), g.trim()])).values()].sort((a, b) =>
    a.localeCompare(b, 'es'),
  )
  const terms = normalize(q).split(/\s+/).filter(Boolean)
  const filtered = docs.filter((b) => {
    if (terms.length) {
      const haystack = normalize([b.title, b.subtitle, ...authorsOf(b).map((a) => a.name)].join(' '))
      if (!terms.every((t) => haystack.includes(t))) return false
    }
    if (genero && !(b.genres ?? []).some((g) => normalize(g) === normalize(genero))) return false
    if (formato === 'digital' && !availability(b).digital) return false
    if (formato === 'fisico') {
      const physical = availability(b).physical
      if (!physical || physical === 'agotado') return false
    }
    return true
  })
  const date = (b: (typeof docs)[number]) => new Date(b.publishedAt ?? b.createdAt).getTime()
  filtered.sort((a, b) =>
    orden === 'titulo' ? a.title.localeCompare(b.title, 'es', { sensitivity: 'base' }) : date(b) - date(a),
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pagina = Math.min(pedida, totalPages)
  const visibles = filtered.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE)
  const hayFiltros = Boolean(q || genero || formato)

  const pageHref = (n: number) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (genero) params.set('genero', genero)
    if (formato) params.set('formato', formato)
    if (orden !== 'recientes') params.set('orden', orden)
    if (n > 1) params.set('pagina', String(n))
    const s = params.toString()
    return s ? `/libros?${s}` : '/libros'
  }

  return (
    <section>
      <header className="cat-encabezado">
        <p className="cat-eyebrow">Catálogo</p>
        <h1>Libros</h1>
        <p>
          Cada libro digital trae EPUB, PDF y audiolibro para leer y escuchar desde cualquier país. Las ediciones impresas
          también incluyen el ebook y el audiolibro, y las enviamos dentro de Chile.
        </p>
      </header>

      {docs.length === 0 ? (
        <div className="cat-vacio">
          <MothMark size={88} color="var(--gold)" />
          <h2>La estantería se está llenando</h2>
          <p>Muy pronto vas a encontrar aquí nuestros libros. Mientras tanto, date una vuelta por las ilustraciones.</p>
          <div className="cat-vacio-acciones">
            <Link className="btn" href="/galeria">
              Ver ilustraciones
            </Link>
          </div>
        </div>
      ) : (
        <>
          <Form
            action="/libros"
            className="cat-filtros"
            role="search"
            aria-label="Buscar y filtrar libros"
            key={`${q}|${genero}|${formato}|${orden}`}
          >
            <div className="cat-filtros-campos">
              <div className="cat-filtro cat-filtro--busqueda">
                <label htmlFor="cat-q">Buscar</label>
                <input id="cat-q" type="search" name="q" defaultValue={q} placeholder="Título o autoría" autoComplete="off" />
              </div>
              <div className="cat-filtro">
                <label htmlFor="cat-genero">Género</label>
                <select id="cat-genero" name="genero" defaultValue={generos.find((g) => normalize(g) === normalize(genero)) ?? ''}>
                  <option value="">Todos</option>
                  {generos.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div className="cat-filtro">
                <label htmlFor="cat-formato">Formato</label>
                <select id="cat-formato" name="formato" defaultValue={formato}>
                  <option value="">Todos</option>
                  <option value="digital">Digital (ebook + audiolibro)</option>
                  <option value="fisico">Físico (envío en Chile)</option>
                </select>
              </div>
              <div className="cat-filtro">
                <label htmlFor="cat-orden">Ordenar por</label>
                <select id="cat-orden" name="orden" defaultValue={orden}>
                  <option value="recientes">Más recientes</option>
                  <option value="titulo">Título (A-Z)</option>
                </select>
              </div>
              <div className="cat-filtros-acciones">
                <button type="submit" className="btn">
                  Buscar
                </button>
              </div>
            </div>
          </Form>

          <div className="cat-resultados">
            <h2 className="cat-sr">Resultados</h2>
            <p role="status">
              {filtered.length === 0
                ? 'Sin resultados'
                : hayFiltros
                  ? `${plural(filtered.length, 'libro')} ${filtered.length === 1 ? 'encontrado' : 'encontrados'}${q ? ` para «${q}»` : ''}`
                  : plural(filtered.length, 'libro')}
            </p>
            {hayFiltros && (
              <Link className="cat-limpiar" href="/libros">
                Limpiar filtros
              </Link>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="cat-vacio">
              <MothMark size={72} color="var(--lilac)" />
              <h2>No encontramos libros con esos filtros</h2>
              <p>Prueba con otra palabra, revisa cómo está escrita o quita algún filtro: a veces el libro está a una búsqueda de distancia.</p>
              <div className="cat-vacio-acciones">
                <Link className="btn" href="/libros">
                  Ver todos los libros
                </Link>
              </div>
            </div>
          ) : (
            <ul className="libro-grid">
              {visibles.map((b, i) => (
                <li key={b.id}>
                  <BookCard book={b} priority={pagina === 1 && i < 4} />
                </li>
              ))}
            </ul>
          )}

          {totalPages > 1 && (
            <nav className="cat-paginacion" aria-label="Páginas del catálogo">
              {pagina > 1 && (
                <Link className="btn secondary" href={pageHref(pagina - 1)} rel="prev">
                  ← Anterior
                </Link>
              )}
              <span>
                Página {pagina} de {totalPages}
              </span>
              {pagina < totalPages && (
                <Link className="btn secondary" href={pageHref(pagina + 1)} rel="next">
                  Siguiente →
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </section>
  )
}
