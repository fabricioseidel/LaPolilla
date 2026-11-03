import type { ServerProps } from 'payload'
import type { Book, Order } from '@/payload-types'
import { Link } from '@payloadcms/ui'
import type { ReactNode } from 'react'
import { ExportarVentas } from './ExportarVentas'
import { IconoAjustes, IconoGuia, IconoLibroNuevo, IconoPaquete } from './iconos'
import {
  ESTADOS_VENTA,
  dinero,
  fechaHoraCorta,
  fechaLarga,
  puedeVerVentas,
  urlPanel,
  urlPedidosPorEstado,
} from './shared'
import './gestion.css'

/** Al llegar a este número de ejemplares (o menos) se muestra la alerta de stock. */
const UMBRAL_STOCK = 10
const DIAS_VENTAS = 30
const MAX_POR_DESPACHAR = 8

type Acceso = { href: string; titulo: string; detalle: string; icono: ReactNode }

/**
 * "Resumen" al inicio del panel.
 * Administradora y jefa de edición: pedidos por despachar, ventas, pendientes, stock y exportación.
 * Autora: sólo los accesos rápidos.
 */
export default async function Resumen({ payload, user, permissions }: ServerProps) {
  if (!user) return null

  const accesos: Acceso[] = []
  if (permissions?.collections?.books?.create)
    accesos.push({
      href: urlPanel(payload, '/collections/books/create'),
      titulo: 'Nuevo libro',
      detalle: 'Crear la ficha de un libro',
      icono: <IconoLibroNuevo />,
    })
  if (permissions?.collections?.orders?.read)
    accesos.push({
      href: urlPanel(payload, '/collections/orders'),
      titulo: 'Pedidos',
      detalle: 'Ventas y despachos',
      icono: <IconoPaquete />,
    })
  if (permissions?.globals?.['site-settings']?.update)
    accesos.push({
      href: urlPanel(payload, '/globals/site-settings'),
      titulo: 'Configuración del sitio',
      detalle: 'Envíos, redes y contacto',
      icono: <IconoAjustes />,
    })
  accesos.push({ href: urlPanel(payload, '/guia'), titulo: 'Guía de uso', detalle: 'Paso a paso del panel', icono: <IconoGuia /> })

  const nombre = typeof user.name === 'string' && user.name.trim() ? user.name.trim().split(/\s+/)[0] : ''

  return (
    <section className="lp-gestion lp-resumen" aria-labelledby="lp-resumen-titulo">
      <header className="lp-resumen__cabecera">
        <h2 id="lp-resumen-titulo" className="lp-resumen__titulo">
          Resumen
        </h2>
        <p className="lp-resumen__saludo">
          Hola{nombre ? `, ${nombre}` : ''}. Hoy es {fechaLarga()}.
        </p>
      </header>

      <nav aria-label="Accesos rápidos">
        <ul className="lp-accesos">
          {accesos.map((a) => (
            <li key={a.href}>
              <Link className="lp-acceso" href={a.href} prefetch={false}>
                <span className="lp-acceso__icono">{a.icono}</span>
                <span className="lp-acceso__texto">
                  <strong>{a.titulo}</strong>
                  <span>{a.detalle}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {puedeVerVentas(user) && <Operacion payload={payload} user={user} />}
    </section>
  )
}

async function Operacion({ payload, user }: Pick<Required<ServerProps>, 'payload' | 'user'>) {
  const desde = new Date(Date.now() - DIAS_VENTAS * 24 * 60 * 60 * 1000).toISOString()
  const comoUsuaria = { user, overrideAccess: false } as const

  const [porDespachar, ventas, pendientes, libros] = await Promise.all([
    payload.find({
      collection: 'orders',
      ...comoUsuaria,
      where: { status: { equals: 'preparando' } },
      sort: 'createdAt', // el más antiguo primero: es el que lleva más tiempo esperando
      limit: MAX_POR_DESPACHAR,
      depth: 0,
      select: { email: true, createdAt: true, shippingAddress: true },
    }),
    payload.find({
      collection: 'orders',
      ...comoUsuaria,
      where: { and: [{ status: { in: ESTADOS_VENTA } }, { createdAt: { greater_than_equal: desde } }] },
      pagination: false,
      depth: 0,
      select: { total: true, currency: true },
    }),
    payload.count({
      collection: 'orders',
      ...comoUsuaria,
      where: { and: [{ status: { equals: 'pendiente' } }, { createdAt: { greater_than_equal: desde } }] },
    }),
    payload.find({
      collection: 'books',
      ...comoUsuaria,
      where: { and: [{ physicalEnabled: { equals: true } }, { status: { in: ['publicado', 'preventa'] } }] },
      pagination: false,
      depth: 0,
      select: { title: true, stock: true, fulfillment: true, status: true },
    }),
  ])

  const suma = (moneda: Order['currency']) => {
    const docs = ventas.docs.filter((o) => o.currency === moneda)
    return { n: docs.length, total: docs.reduce((s, o) => s + (o.total ?? 0), 0) }
  }
  const clp = suma('CLP')
  const usd = suma('USD')

  // Primero los de stock propio (menos ejemplares arriba); después los de impresión bajo demanda.
  const stock = [...libros.docs].sort((a, b) => {
    const pa = a.fulfillment === 'pod' ? Infinity : (a.stock ?? 0)
    const pb = b.fulfillment === 'pod' ? Infinity : (b.stock ?? 0)
    return pa - pb || a.title.localeCompare(b.title, 'es')
  })
  const enAlerta = stock.filter((b) => b.fulfillment !== 'pod' && (b.stock ?? 0) <= UMBRAL_STOCK).length

  return (
    <>
      <div className="lp-cifras">
        <div className="lp-cifra lp-cifra--destacada">
          <span className="lp-cifra__rotulo">Por despachar</span>
          <span className="lp-cifra__valor">{porDespachar.totalDocs}</span>
          <span className="lp-cifra__detalle">
            {porDespachar.totalDocs === 1 ? 'pedido en «Preparando envío»' : 'pedidos en «Preparando envío»'}
          </span>
        </div>
        <div className="lp-cifra">
          <span className="lp-cifra__rotulo">Ventas · últimos {DIAS_VENTAS} días</span>
          <span className="lp-cifra__valor">{ventas.docs.length}</span>
          <span className="lp-cifra__montos">
            <span>
              {dinero(clp.total, 'CLP')} <span>en CLP ({clp.n})</span>
            </span>
            <span>
              {dinero(usd.total, 'USD')} <span>en USD ({usd.n})</span>
            </span>
          </span>
        </div>
        <div className="lp-cifra">
          <span className="lp-cifra__rotulo">Pendientes de pago · últimos {DIAS_VENTAS} días</span>
          <span className="lp-cifra__valor">{pendientes.totalDocs}</span>
          <span className="lp-cifra__detalle">Compras iniciadas sin pago confirmado. No requieren acción.</span>
          <Link className="lp-cifra__enlace" href={urlPedidosPorEstado(payload, 'pendiente')} prefetch={false}>
            Ver pendientes
          </Link>
        </div>
      </div>

      <div className="lp-paneles">
        <section className="lp-panel" aria-labelledby="lp-despachar-titulo">
          <div className="lp-panel__cabecera">
            <h3 id="lp-despachar-titulo" className="lp-seccion-titulo">
              Pedidos por despachar
            </h3>
            {porDespachar.totalDocs > 0 && (
              <Link className="lp-enlace" href={urlPedidosPorEstado(payload, 'preparando', 'createdAt')} prefetch={false}>
                Ver todos ({porDespachar.totalDocs})
              </Link>
            )}
          </div>
          {porDespachar.totalDocs === 0 ? (
            <p className="lp-vacio">No hay libros físicos esperando despacho. ¡Todo al día!</p>
          ) : (
            <>
              <p className="lp-panel__nota">Del más antiguo al más reciente.</p>
              <ul className="lp-lista">
                {porDespachar.docs.map((p) => {
                  const dir = p.shippingAddress
                  const lugar = [dir?.comuna, dir?.region].filter(Boolean).join(', ')
                  return (
                    <li key={p.id} className="lp-pedido">
                      <span className="lp-pedido__n">N° {p.id}</span>
                      <span className="lp-pedido__quien">
                        <strong>{dir?.name || p.email}</strong>
                        <span>
                          {lugar || 'Sin dirección'} · {fechaHoraCorta(p.createdAt)}
                        </span>
                      </span>
                      <Link
                        className="lp-pedido__accion"
                        href={urlPanel(payload, `/collections/orders/${p.id}`)}
                        prefetch={false}
                        aria-label={`Ver pedido N° ${p.id}`}
                      >
                        Ver pedido
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </section>

        <section className="lp-panel" aria-labelledby="lp-stock-titulo">
          <div className="lp-panel__cabecera">
            <h3 id="lp-stock-titulo" className="lp-seccion-titulo">
              Stock de libros físicos
            </h3>
          </div>
          <p className="lp-panel__nota">Libros publicados o en preventa con versión física.</p>
          {stock.length === 0 ? (
            <p className="lp-vacio">No hay libros físicos a la venta.</p>
          ) : (
            <ul className="lp-lista">
              {stock.map((b) => (
                <li key={b.id} className="lp-libro">
                  <span>
                    <Link href={urlPanel(payload, `/collections/books/${b.id}`)} prefetch={false}>
                      {b.title}
                    </Link>
                    {b.status === 'preventa' && <span className="lp-libro__estado">En preventa</span>}
                  </span>
                  <EstadoStock libro={b} />
                </li>
              ))}
            </ul>
          )}
          {enAlerta > 0 && (
            <p className="lp-aviso" role="note">
              Quedan pocos ejemplares. Repón stock o cambia el «Modo de despacho» del libro a «Impresión bajo demanda».
            </p>
          )}
        </section>
      </div>

      <section className="lp-panel" aria-labelledby="lp-exportar-titulo">
        <h3 id="lp-exportar-titulo" className="lp-seccion-titulo">
          Exportar ventas para boletas (CSV)
        </h3>
        <ExportarVentas idBase="lp-csv-resumen" />
      </section>
    </>
  )
}

function EstadoStock({ libro }: { libro: Pick<Book, 'stock' | 'fulfillment'> }) {
  if (libro.fulfillment === 'pod') return <span className="lp-chip lp-chip--neutro">Bajo demanda</span>
  const n = libro.stock ?? 0
  if (n === 0) return <span className="lp-chip lp-chip--agotado">Agotado</span>
  if (n <= UMBRAL_STOCK)
    return <span className="lp-chip lp-chip--alerta">{n === 1 ? 'Queda 1' : `Quedan ${n}`} · ¡pocos!</span>
  return <span className="lp-chip lp-chip--ok">{n} en stock</span>
}
