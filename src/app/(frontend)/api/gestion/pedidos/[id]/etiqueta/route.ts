import type { Book } from '@/payload-types'
import { ZONA_CHILE, urlPanel } from '@/components/admin/gestion/shared'
import { esc, paginaError, sesionGestion } from '../../../_lib/sesion'

/**
 * Datos del remitente impresos en la etiqueta.
 * TODO: reemplazar los marcadores [entre corchetes] por los datos reales de la editorial
 * (idealmente, moverlos a "Configuración del sitio" para que se editen desde el panel).
 */
const REMITENTE = {
  nombre: 'Editorial La Polilla',
  direccion: '[Dirección del remitente]',
  comuna: '[Comuna], [Región]',
  telefono: '[Teléfono del remitente]',
}

const FORMATOS = {
  'media-carta': { nombre: 'Media carta', page: '5.5in 8.5in', margen: '8mm', escala: 1.2 },
  a6: { nombre: 'A6', page: '105mm 148mm', margen: '5mm', escala: 1 },
} as const
type Formato = keyof typeof FORMATOS

/**
 * Etiqueta de despacho imprimible (HTML en blanco y negro) de un pedido con libros físicos.
 * GET /api/gestion/pedidos/[id]/etiqueta?formato=media-carta|a6 — sólo el equipo de la editorial.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await sesionGestion(req, 'equipo')
  if (sesion.error) return sesion.error
  const { payload, user } = sesion

  const { id } = await params
  if (!/^\d+$/.test(id)) return paginaError(404, 'Pedido no encontrado', 'Revisa el número del pedido.')

  const pedido = await payload
    .findByID({ collection: 'orders', id: Number(id), depth: 1, populate: { books: { title: true } }, user, overrideAccess: false })
    .catch(() => null)
  if (!pedido) return paginaError(404, 'Pedido no encontrado', `No existe el pedido N° ${id}.`)

  const fisicos = pedido.items.filter((i) => i.format === 'fisico')
  if (!fisicos.length)
    return paginaError(404, 'Este pedido no necesita etiqueta', `El pedido N° ${pedido.id} sólo tiene libros digitales: no hay nada que despachar.`)

  const ajustes = await payload.findGlobal({ slug: 'site-settings', depth: 0 }).catch(() => null)
  const emailRemitente = ajustes?.contactEmail || '[Email de contacto]'

  const formato: Formato = new URL(req.url).searchParams.get('formato') === 'a6' ? 'a6' : 'media-carta'
  const f = FORMATOS[formato]
  const dir = pedido.shippingAddress ?? {}
  const envio = pedido.shipment ?? {}
  const unidades = fisicos.reduce((n, i) => n + (i.quantity ?? 1), 0)
  const fecha = new Intl.DateTimeFormat('es-CL', { timeZone: ZONA_CHILE, day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(pedido.createdAt),
  )
  const volver = urlPanel(payload, `/collections/orders/${pedido.id}`)
  const enlaceFormato = (k: Formato) =>
    `<a href="?formato=${k}"${k === formato ? ' aria-current="true"' : ''}>${FORMATOS[k].nombre}</a>`

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Etiqueta pedido N° ${pedido.id} · La Polilla</title>
<style>
  @page { size: ${f.page}; margin: ${f.margen}; }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; background: #e6e6e6; color: #000; font-family: Arial, Helvetica, sans-serif; }
  .barra { background: #fff; border-bottom: 1px solid #bbb; padding: 12px 16px; display: flex; flex-wrap: wrap; gap: 12px 24px; align-items: center; }
  .barra h1 { font-size: 18px; margin: 0; flex: 1 1 100%; }
  .barra p { margin: 0; font-size: 14px; flex: 1 1 100%; color: #333; }
  .barra button { font: inherit; font-size: 16px; font-weight: 700; padding: 10px 20px; border-radius: 6px; border: 2px solid #000; background: #000; color: #fff; cursor: pointer; }
  .barra button:hover { background: #333; }
  .barra button:focus-visible, .barra a:focus-visible { outline: 3px solid #E8B04B; outline-offset: 2px; }
  .tamano { display: flex; gap: 4px; align-items: center; font-size: 14px; }
  .tamano a { color: #000; padding: 6px 10px; border: 1px solid #888; border-radius: 6px; text-decoration: none; }
  .tamano a[aria-current] { background: #000; color: #fff; border-color: #000; font-weight: 700; }
  .volver { color: #000; font-size: 14px; }
  .hoja { padding: 24px 16px 48px; display: flex; justify-content: center; }
  .etiqueta {
    --e: ${f.escala};
    width: calc(95mm * var(--e)); max-width: 100%; background: #fff; border: 2px solid #000; font-size: calc(10pt * var(--e)); line-height: 1.3;
  }
  .bloque { padding: calc(3mm * var(--e)) calc(4mm * var(--e)); border-bottom: 2px solid #000; }
  .bloque:last-child { border-bottom: 0; }
  .rotulo { font-size: calc(7.5pt * var(--e)); font-weight: 700; letter-spacing: .12em; text-transform: uppercase; margin: 0 0 1mm; }
  .remitente p { margin: 0; }
  .destinatario .nombre { font-size: calc(15pt * var(--e)); font-weight: 700; margin: 0 0 1mm; text-transform: uppercase; overflow-wrap: anywhere; }
  .destinatario .calle { font-size: calc(13pt * var(--e)); margin: 0; overflow-wrap: anywhere; }
  .destinatario .comuna { font-size: calc(14pt * var(--e)); font-weight: 700; margin: 1mm 0 0; text-transform: uppercase; }
  .destinatario .tel { font-size: calc(12pt * var(--e)); margin: 2mm 0 0; }
  .destinatario .notas { margin: 2mm 0 0; padding: 1.5mm 2mm; border: 1px dashed #000; font-size: calc(9pt * var(--e)); }
  .datos { display: flex; justify-content: space-between; gap: 3mm; flex-wrap: wrap; }
  .datos .n { font-size: calc(16pt * var(--e)); font-weight: 700; margin: 0; }
  .datos p { margin: 0; }
  .retiro { display: inline-block; border: 2px solid #000; padding: .5mm 2mm; font-weight: 700; text-transform: uppercase; }
  .contenido ul { margin: 0; padding-left: 5mm; }
  .contenido li { margin: .5mm 0; }
  @media print {
    body { background: #fff; }
    .barra { display: none; }
    .hoja { padding: 0; display: block; }
    .etiqueta { width: 100%; break-inside: avoid; }
  }
</style>
</head>
<body>
<header class="barra">
  <h1>Etiqueta de despacho · Pedido N° ${pedido.id}</h1>
  <p>Revisa los datos, elige el tamaño de papel e imprime. Pégala en el paquete.</p>
  <button type="button" onclick="window.print()">Imprimir etiqueta</button>
  <nav class="tamano" aria-label="Tamaño de papel">Tamaño: ${enlaceFormato('media-carta')} ${enlaceFormato('a6')}</nav>
  <a class="volver" href="${esc(volver)}">Volver al pedido</a>
</header>
<main class="hoja">
  <article class="etiqueta" aria-label="Etiqueta del pedido N° ${pedido.id}">
    <section class="bloque remitente">
      <p class="rotulo">Remitente</p>
      <p><strong>${esc(REMITENTE.nombre)}</strong></p>
      <p>${esc(REMITENTE.direccion)}</p>
      <p>${esc(REMITENTE.comuna)}</p>
      <p>Tel. ${esc(REMITENTE.telefono)} · ${esc(emailRemitente)}</p>
    </section>
    <section class="bloque destinatario">
      <p class="rotulo">Destinatario</p>
      <p class="nombre">${esc(dir.name || '[Falta el nombre]')}</p>
      <p class="calle">${esc(dir.street || '[Falta la dirección]')}</p>
      <p class="comuna">${esc(dir.comuna || '[Falta la comuna]')}${dir.region ? ` — ${esc(dir.region)}` : ''}</p>
      <p class="tel">Tel. ${esc(dir.phone || '—')}</p>
      ${dir.notes ? `<p class="notas"><strong>Indicaciones:</strong> ${esc(dir.notes)}</p>` : ''}
    </section>
    <section class="bloque datos">
      <div>
        <p class="rotulo">Pedido</p>
        <p class="n">N° ${pedido.id}</p>
        <p>${esc(fecha)}</p>
      </div>
      ${
        envio.carrier
          ? `<div>
        <p class="rotulo">Courier</p>
        <p>${envio.carrier === 'Retiro' ? '<span class="retiro">Retiro en persona</span>' : esc(envio.carrier)}</p>
        ${envio.trackingCode ? `<p>Seguimiento: <strong>${esc(envio.trackingCode)}</strong></p>` : ''}
      </div>`
          : ''
      }
    </section>
    <section class="bloque contenido">
      <p class="rotulo">Contenido (${unidades} ${unidades === 1 ? 'libro' : 'libros'})</p>
      <ul>
        ${fisicos
          .map((i) => `<li>${i.quantity ?? 1} × ${esc(typeof i.book === 'object' ? (i.book as Book).title : `Libro ${i.book}`)}</li>`)
          .join('\n        ')}
      </ul>
    </section>
  </article>
</main>
</body>
</html>`

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  })
}
