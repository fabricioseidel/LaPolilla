import { headers as getHeaders } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import '../styles/catalogo.css'
import { BookCover } from '@/components/catalogo/BookCover'
import { authorNames, formatDate } from '@/components/catalogo/libro'
import { MothMark } from '@/components/Logo'
import { money } from '@/lib/format'
import { getPayloadClient } from '@/lib/payload'
import type { Order } from '@/payload-types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Mi biblioteca', robots: { index: false, follow: false } }

const STATUS: Record<Order['status'], string> = {
  pendiente: 'Pendiente de pago',
  pagado: 'Pagado',
  preparando: 'Preparando envío',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
  reembolsado: 'Reembolsado',
}
/** Etapas de un pedido con libro físico. */
const STEPS: [Order['status'], string][] = [
  ['pagado', 'Pago confirmado'],
  ['preparando', 'Preparando'],
  ['enviado', 'Enviado'],
  ['entregado', 'Entregado'],
]
const relId = (v: number | { id: number }) => (typeof v === 'object' ? v.id : v)
/** En dólares se aclara "US$" para no confundir con pesos. */
const price = (n: number, currency: Order['currency']) => (currency === 'USD' ? `US${money(n, 'USD')}` : money(n, 'CLP'))

export default async function Biblioteca() {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) redirect('/cuenta/ingresar?volver=/biblioteca')

  const [ents, orders] = await Promise.all([
    payload.find({
      collection: 'entitlements',
      where: { user: { equals: user.id } },
      sort: '-createdAt',
      pagination: false,
      depth: 0,
      user,
      overrideAccess: false,
    }),
    // Los pedidos pendientes son pagos que no se completaron: no son compras.
    payload.find({
      collection: 'orders',
      where: { and: [{ user: { equals: user.id } }, { status: { not_equals: 'pendiente' } }] },
      sort: '-createdAt',
      limit: 50,
      depth: 1,
      user,
      overrideAccess: false,
    }),
  ])

  // Los libros comprados se muestran aunque luego hayan vuelto a borrador.
  const ids = ents.docs.map((e) => relId(e.book))
  const books = ids.length
    ? (
        await payload.find({
          collection: 'books',
          where: { id: { in: ids } },
          pagination: false,
          depth: 1,
          overrideAccess: true,
          select: { title: true, slug: true, authors: true, cover: true, status: true, publishedAt: true, epub: true, pdf: true, audioChapters: true },
          populate: { authors: { name: true, slug: true }, 'protected-files': { kind: true } },
        })
      ).docs
    : []
  const byId = new Map(books.map((b) => [b.id, b]))
  const shelf = ents.docs.flatMap((e) => {
    const book = byId.get(relId(e.book))
    return book ? [{ ent: e, book }] : []
  })

  return (
    <section>
      <header className="cat-encabezado">
        <p className="cat-eyebrow">Tu cuenta</p>
        <h1>Mi biblioteca</h1>
        <p>
          {user.name ? `Hola, ${user.name.split(' ')[0]}. ` : ''}Aquí están tus libros: descarga el ebook y escucha el audiolibro
          cuando quieras.
        </p>
      </header>

      {shelf.length === 0 ? (
        <div className="cat-vacio">
          <MothMark size={88} color="var(--gold)" />
          <h2>Tu estantería espera su primer libro</h2>
          <p>Cuando compres un libro, aquí vas a encontrar el ebook (EPUB y PDF) y el audiolibro, listos para leer y escuchar.</p>
          <div className="cat-vacio-acciones">
            <Link className="btn" href="/libros">
              Explorar el catálogo
            </Link>
          </div>
        </div>
      ) : (
        <section aria-labelledby="mis-libros">
          <h2 id="mis-libros" className="cat-sr">
            Mis libros
          </h2>
          <ul className="biblio-estante">
            {shelf.map(({ ent, book }) => {
              const chapters = book.audioChapters?.length ?? 0
              const progress = ent.audioProgress as { chapter?: number; seconds?: number } | null
              const hasFiles = Boolean(book.epub || book.pdf || chapters)
              let note = 'Ebook y audiolibro'
              if (!hasFiles)
                note =
                  book.status === 'preventa' && book.publishedAt && new Date(book.publishedAt) > new Date()
                    ? `Disponible desde el ${formatDate(book.publishedAt)}`
                    : 'Archivos en preparación'
              else if (chapters && progress && (progress.chapter || progress.seconds))
                note = `Audiolibro: capítulo ${Math.min((progress.chapter ?? 0) + 1, chapters)} de ${chapters}`
              return (
                <li key={ent.id} className="libro-card biblio-libro">
                  <BookCover book={book} sizes="(min-width: 720px) 200px, 45vw" />
                  <h3>
                    <Link className="libro-card-enlace" href={`/biblioteca/${book.slug}`}>
                      {book.title}
                    </Link>
                  </h3>
                  {authorNames(book) && <p>{authorNames(book)}</p>}
                  <p className={hasFiles && note.startsWith('Audiolibro') ? 'biblio-avance' : undefined}>{note}</p>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {orders.docs.length > 0 && (
        <section className="cat-seccion" aria-labelledby="mis-pedidos">
          <h2 id="mis-pedidos">Mis pedidos</h2>
          <ul className="biblio-pedidos">
            {orders.docs.map((o) => {
              const physical = o.items.some((i) => i.format === 'fisico')
              const step = STEPS.findIndex(([s]) => s === o.status)
              const carrier = o.shipment?.carrier === 'Retiro' ? 'Retiro en persona' : o.shipment?.carrier
              return (
                <li key={o.id}>
                  <article className="pedido" aria-labelledby={`pedido-${o.id}`}>
                    <div className="pedido-cabecera">
                      <div>
                        <h3 id={`pedido-${o.id}`}>Pedido #{o.id}</h3>
                        <p>
                          <time dateTime={o.createdAt}>{formatDate(o.createdAt)}</time>
                        </p>
                      </div>
                      <span className={`pedido-estado pedido-estado--${o.status}`}>{STATUS[o.status]}</span>
                    </div>

                    <ul className="pedido-items">
                      {o.items.map((it) => (
                        <li key={it.id ?? `${relId(it.book)}-${it.format}`}>
                          <span>
                            {typeof it.book === 'object' ? it.book.title : 'Libro'} ·{' '}
                            {it.format === 'digital' ? 'Digital' : `Físico${(it.quantity ?? 1) > 1 ? ` ×${it.quantity}` : ''}`}
                          </span>
                          <span>{price(it.unitPrice * (it.quantity ?? 1), o.currency)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="pedido-total">
                      <span>Total{o.shipping ? ` (incluye envío ${price(o.shipping, o.currency)})` : ''}</span>
                      <span>{price(o.total, o.currency)}</span>
                    </p>

                    {physical && step >= 0 && (
                      <ol className="pedido-pasos" aria-label="Estado del envío">
                        {STEPS.map(([s, label], i) => (
                          <li
                            key={s}
                            className={`pedido-paso${i <= step ? ' pedido-paso--hecho' : ''}`}
                            aria-current={i === step ? 'step' : undefined}
                          >
                            {label}
                            {i < step && <span className="cat-sr"> (listo)</span>}
                          </li>
                        ))}
                      </ol>
                    )}

                    {physical && (o.status === 'enviado' || o.status === 'entregado') && (carrier || o.shipment?.trackingCode) && (
                      <p className="pedido-seguimiento">
                        {carrier && (
                          <span>
                            Courier: <strong>{carrier}</strong>
                          </span>
                        )}
                        {o.shipment?.trackingCode && (
                          <span>
                            N° de seguimiento: <code>{o.shipment.trackingCode}</code>
                          </span>
                        )}
                      </p>
                    )}
                    {physical && o.status === 'preparando' && (
                      <p className="compra-nota">Estamos preparando tu libro. Te escribiremos cuando lo despachemos.</p>
                    )}
                    {o.invoice?.url && (
                      <p>
                        <a href={o.invoice.url} rel="noopener">
                          Ver boleta
                        </a>
                      </p>
                    )}
                  </article>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </section>
  )
}
