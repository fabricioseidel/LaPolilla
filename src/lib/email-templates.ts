/**
 * Plantillas de correo con la identidad "Nocturna".
 *
 * El HTML está pensado para clientes de correo (Gmail, Outlook, Apple Mail):
 * tablas, estilos en línea y ancho máximo de 600 px. Cada correo se arma con
 * "bloques" que se dibujan dos veces, en HTML y en texto plano, para que ambas
 * versiones digan siempre lo mismo. Funciones puras: no dependen de Payload.
 */
import type { Order } from '../payload-types'
import { money } from './format'
import { DEFAULT_TAGLINE, SITE_NAME, absoluteUrl, externalUrl } from './seo'

export type EmailContent = { subject: string; html: string; text: string }

/** Datos de "Configuración del sitio" que aparecen en la cabecera y el pie. */
export type EmailSettings = {
  tagline?: string | null
  contactEmail?: string | null
  instagram?: string | null
  youtube?: string | null
}

// ---------------------------------------------------------------------------
// Colores y tipografías (los de styles.css, ajustados a un cuerpo claro)
// ---------------------------------------------------------------------------
const C = {
  night: '#1C1830', // cabecera
  gold: '#E8B04B', // marca y botón
  soft: '#D9D2E6', // lema sobre la cabecera
  page: '#F3EEF9', // fondo exterior (papel luna)
  card: '#FFFFFF', // cuerpo
  text: '#2A2347', // texto (contraste 14:1 sobre blanco)
  muted: '#5E5873', // texto secundario (6,7:1)
  link: '#5D4596', // enlaces sobre fondo claro (7,6:1)
  line: '#E6E0F0', // separadores
  box: '#F7F4FB', // recuadros
}
const SERIF = "Fraunces, Georgia, 'Times New Roman', serif"
const SANS = "Inter, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
export const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

/** "Ana María Pérez" → "Ana". */
const firstName = (name?: string | null) => name?.trim().split(/\s+/)[0] || ''
export const greeting = (name?: string | null) => (firstName(name) ? `¡Hola, ${firstName(name)}!` : '¡Hola!')

const formatDate = (iso?: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ''
    : new Intl.DateTimeFormat('es-CL', { dateStyle: 'long', timeZone: 'America/Santiago' }).format(d)
}

// ---------------------------------------------------------------------------
// Bloques
// ---------------------------------------------------------------------------
/** Texto con negritas y enlaces: ['Ve a ', { link: 'Mi biblioteca', href }, '.'] */
type Inline = string | { strong: string } | { link: string; href: string }
type Rich = string | Inline[]

type OrderRow = { title: string; detail: string; quantity: number; unit: string; amount: string }
type TotalRow = { label: string; amount: string; strong?: boolean }

export type Block =
  | { type: 'heading'; text: string }
  | { type: 'subheading'; text: string }
  | { type: 'paragraph'; content: Rich; small?: boolean }
  | { type: 'button'; label: string; href: string }
  | { type: 'list'; items: Rich[] }
  | { type: 'box'; title: string; lines: Rich[] }
  | { type: 'order'; rows: OrderRow[]; totals: TotalRow[] }
  | { type: 'linkFallback'; href: string }

const inlineHtml = (rich: Rich) =>
  (typeof rich === 'string' ? [rich] : rich)
    .map((part) => {
      if (typeof part === 'string') return escapeHtml(part)
      if ('strong' in part) return `<strong style="color:${C.night};">${escapeHtml(part.strong)}</strong>`
      return `<a href="${escapeHtml(part.href)}" style="color:${C.link};text-decoration:underline;">${escapeHtml(part.link)}</a>`
    })
    .join('')

const inlineText = (rich: Rich) =>
  (typeof rich === 'string' ? [rich] : rich)
    .map((part) => {
      if (typeof part === 'string') return part
      if ('strong' in part) return part.strong
      const href = part.href.replace(/^mailto:/, '')
      return href === part.link ? href : `${part.link} (${href})`
    })
    .join('')

function blockHtml(b: Block): string {
  switch (b.type) {
    case 'heading':
      return `<h1 class="h1" style="margin:0 0 16px;font-family:${SERIF};font-size:28px;line-height:1.25;font-weight:bold;color:${C.night};">${escapeHtml(b.text)}</h1>`
    case 'subheading':
      return `<h2 style="margin:28px 0 8px;font-family:${SERIF};font-size:20px;line-height:1.3;font-weight:bold;color:${C.night};">${escapeHtml(b.text)}</h2>`
    case 'paragraph':
      return b.small
        ? `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:${C.muted};">${inlineHtml(b.content)}</p>`
        : `<p style="margin:0 0 16px;">${inlineHtml(b.content)}</p>`
    case 'button':
      return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;"><tr>
<td bgcolor="${C.gold}" style="background:${C.gold};border-radius:999px;">
<a href="${escapeHtml(b.href)}" style="display:inline-block;padding:14px 28px;font-family:${SANS};font-size:16px;line-height:20px;font-weight:bold;color:${C.night};text-decoration:none;border-radius:999px;">${escapeHtml(b.label)}</a>
</td></tr></table>`
    case 'list':
      return `<ul style="margin:0 0 16px;padding:0 0 0 22px;">${b.items
        .map((item) => `<li style="margin:0 0 8px;">${inlineHtml(item)}</li>`)
        .join('')}</ul>`
    case 'box':
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;"><tr>
<td style="background:${C.box};border-left:4px solid ${C.gold};border-radius:8px;padding:16px 18px;">
<p style="margin:0 0 6px;font-weight:bold;color:${C.night};">${escapeHtml(b.title)}</p>
<p style="margin:0;">${b.lines.map(inlineHtml).join('<br>')}</p>
</td></tr></table>`
    case 'order': {
      const cell = `border-bottom:1px solid ${C.line};vertical-align:top;`
      const rows = b.rows
        .map(
          (r) => `<tr>
<td style="padding:14px 0;${cell}">
<div style="font-weight:bold;color:${C.night};">${escapeHtml(r.title)}</div>
<div style="font-size:14px;line-height:1.5;color:${C.muted};">${escapeHtml(r.detail)}</div>
${r.quantity > 1 ? `<div style="font-size:14px;line-height:1.5;color:${C.muted};">${r.quantity} × ${escapeHtml(r.unit)}</div>` : ''}
</td>
<td align="right" style="padding:14px 0 14px 16px;${cell}white-space:nowrap;font-weight:bold;color:${C.night};">${escapeHtml(r.amount)}</td>
</tr>`,
        )
        .join('')
      const totals = b.totals
        .map((t, i) => {
          const pad = i === 0 ? '14px 0 4px' : t.strong ? '12px 0 0' : '4px 0'
          const style = t.strong
            ? `border-top:2px solid ${C.night};font-weight:bold;font-size:18px;color:${C.night};`
            : `color:${C.muted};`
          return `<tr><td style="padding:${pad};${style}">${escapeHtml(t.label)}</td><td align="right" style="padding:${pad};padding-left:16px;white-space:nowrap;${style}">${escapeHtml(t.amount)}</td></tr>`
        })
        .join('')
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 24px;">${rows}${totals}</table>`
    }
    case 'linkFallback':
      return `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${C.muted};">Si el botón no funciona, copia y pega este enlace en tu navegador:<br><a href="${escapeHtml(b.href)}" style="color:${C.link};word-break:break-all;">${escapeHtml(b.href)}</a></p>`
  }
}

function blockText(b: Block): string {
  switch (b.type) {
    case 'heading':
      return b.text.toUpperCase()
    case 'subheading':
      return `${b.text}\n${'-'.repeat(Math.min(b.text.length, 60))}`
    case 'paragraph':
      return inlineText(b.content)
    case 'button':
      return `${b.label}:\n${b.href}`
    case 'list':
      return b.items.map((item) => `- ${inlineText(item)}`).join('\n')
    case 'box':
      return `${b.title}:\n${b.lines.map((l) => `  ${inlineText(l)}`).join('\n')}`
    case 'order':
      return [
        ...b.rows.map(
          (r) => `- ${r.title}\n  ${r.detail}\n  ${r.quantity > 1 ? `${r.quantity} × ${r.unit} = ` : ''}${r.amount}`,
        ),
        '',
        ...b.totals.map((t) => `${t.strong ? t.label.toUpperCase() : t.label}: ${t.amount}`),
      ].join('\n')
    case 'linkFallback':
      return '' // en texto plano el enlace ya aparece completo
  }
}

// ---------------------------------------------------------------------------
// Layout común
// ---------------------------------------------------------------------------
type LayoutArgs = {
  subject: string
  /** Resumen que muestran las bandejas de entrada junto al asunto. */
  preheader: string
  blocks: Block[]
  /** Por qué recibe este correo (va en el pie). */
  reason: string
  settings?: EmailSettings
}

export function renderEmail({ subject, preheader, blocks, reason, settings = {} }: LayoutArgs): EmailContent {
  const tagline = settings.tagline?.trim() || DEFAULT_TAGLINE
  const home = absoluteUrl('/')
  const footerLinks = [
    { label: 'Libros', href: absoluteUrl('/libros') },
    { label: 'Mi biblioteca', href: absoluteUrl('/biblioteca') },
    { label: 'Mi cuenta', href: absoluteUrl('/cuenta') },
    { label: 'Instagram', href: externalUrl(settings.instagram) },
    { label: 'YouTube', href: externalUrl(settings.youtube) },
  ].filter((l): l is { label: string; href: string } => Boolean(l.href))
  const contact = settings.contactEmail?.trim()

  const footerLink = (l: { label: string; href: string }) =>
    `<a href="${escapeHtml(l.href)}" style="display:inline-block;padding:12px 10px;color:${C.link};text-decoration:underline;">${escapeHtml(l.label)}</a>`

  const html = `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${escapeHtml(subject)}</title>
<style>
  body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; }
  a { color: ${C.link}; }
  @media (max-width: 620px) {
    .container { width: 100% !important; }
    .px { padding-left: 20px !important; padding-right: 20px !important; }
    .h1 { font-size: 24px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${C.page};">
<div data-preheader style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;color:${C.page};">${escapeHtml(preheader)}${'&nbsp;&zwnj;'.repeat(40)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.page}" style="background:${C.page};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">
<tr><td class="px" bgcolor="${C.night}" align="center" style="background:${C.night};border-radius:16px 16px 0 0;padding:28px 32px;">
<a href="${escapeHtml(home)}" style="font-family:${SERIF};font-size:26px;line-height:1.3;font-weight:bold;color:${C.gold};text-decoration:none;">La Polilla &middot; Editorial</a>
<div style="margin-top:6px;font-family:${SERIF};font-size:15px;line-height:1.4;font-style:italic;color:${C.soft};">${escapeHtml(tagline)}</div>
</td></tr>
<tr><td class="px" bgcolor="${C.card}" style="background:${C.card};border-radius:0 0 16px 16px;padding:32px;font-family:${SANS};font-size:16px;line-height:1.6;color:${C.text};">
${blocks.map(blockHtml).join('\n')}
</td></tr>
<tr><td class="px" align="center" style="padding:20px 32px 8px;font-family:${SANS};font-size:14px;line-height:1.6;color:${C.muted};">
<p style="margin:0 0 8px;">${footerLinks.map(footerLink).join(' ')}</p>
<p style="margin:0 0 6px;">${escapeHtml(SITE_NAME)} &middot; ${escapeHtml(tagline)}</p>
${contact ? `<p style="margin:0 0 6px;">Contacto: <a href="mailto:${escapeHtml(contact)}" style="color:${C.link};">${escapeHtml(contact)}</a></p>` : ''}
<p style="margin:0;font-size:13px;">${escapeHtml(reason)}</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`

  const rule = '-'.repeat(40)
  const text = [
    'LA POLILLA · EDITORIAL',
    tagline,
    '='.repeat(40),
    '',
    blocks.map(blockText).filter(Boolean).join('\n\n'),
    '',
    rule,
    `${SITE_NAME} · ${tagline}`,
    ...footerLinks.map((l) => `${l.label}: ${l.href}`),
    ...(contact ? [`Contacto: ${contact}`] : []),
    reason,
  ].join('\n')

  return { subject, html, text }
}

/**
 * Texto plano aproximado a partir de HTML. Se usa como respaldo para correos que
 * llegan sólo con HTML (p. ej. el de "olvidé mi contraseña", que arma Payload).
 */
export function htmlToText(html: string): string {
  const stripTags = (s: string) => s.replace(/<[^>]+>/g, '')
  const out = html
    .replace(/<(head|style|script|title)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<div[^>]*data-preheader[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<a\b[^>]*?href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi, (_m, _q, href: string, inner: string) => {
      const label = decodeEntities(stripTags(inner)).trim()
      const url = decodeEntities(href).replace(/^mailto:/i, '')
      return !label || label === url ? url : `${label} (${url})`
    })
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '\n- ')
    .replace(/<\/(p|div|h[1-6]|tr|table|ul|ol|li)>/gi, '\n')
    .replace(/<\/td>/gi, ' ')
  return decodeEntities(stripTags(out))
    .split('\n')
    .map((line) => line.replace(/[ \t ‌]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', middot: '·', zwnj: '' }
const decodeEntities = (s: string) =>
  s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, code: string) => {
    if (code[0] !== '#') return ENTITIES[code.toLowerCase()] ?? m
    const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
    return Number.isFinite(n) ? String.fromCodePoint(n) : m
  })

// ---------------------------------------------------------------------------
// Correos
// ---------------------------------------------------------------------------
type Address = NonNullable<Order['shippingAddress']>

const addressLines = (a?: Address | null): string[] =>
  a
    ? [
        a.name,
        a.street,
        [a.comuna, a.region].filter(Boolean).join(', '),
        a.phone && `Teléfono: ${a.phone}`,
        a.notes && `Indicaciones: ${a.notes}`,
      ].filter((l): l is string => Boolean(l))
    : []

const FORMAT_LABEL = {
  digital: 'Digital: ebook (EPUB y PDF) + audiolibro',
  fisico: 'Libro impreso, con ebook y audiolibro incluidos',
} as const

/** (a) Compra confirmada. `titles` traduce el id de cada libro a su título. */
export function orderPaidEmail(
  args: { order: Order; titles: Record<string, string>; customerName?: string | null },
  settings?: EmailSettings,
): EmailContent {
  const { order, titles, customerName } = args
  const m = (n?: number | null) => money(n ?? 0, order.currency)
  const physical = order.items.some((i) => i.format === 'fisico')
  const bookId = (b: Order['items'][number]['book']) => String(typeof b === 'object' ? b.id : b)
  const date = formatDate(order.createdAt)

  const rows: OrderRow[] = order.items.map((item) => {
    const qty = item.quantity ?? 1
    const title = (typeof item.book === 'object' && item.book.title) || titles[bookId(item.book)] || 'Libro'
    return { title, detail: FORMAT_LABEL[item.format], quantity: qty, unit: m(item.unitPrice), amount: m(item.unitPrice * qty) }
  })
  const totals: TotalRow[] = [
    { label: 'Subtotal', amount: m(order.subtotal) },
    ...(physical || (order.shipping ?? 0) > 0
      ? [{ label: 'Envío', amount: (order.shipping ?? 0) > 0 ? m(order.shipping) : 'Sin costo' }]
      : []),
    { label: 'Total', amount: `${m(order.total)} ${order.currency}`, strong: true },
  ]

  const blocks: Block[] = [
    { type: 'heading', text: '¡Gracias por tu compra!' },
    { type: 'paragraph', content: greeting(customerName) },
    {
      type: 'paragraph',
      content: [
        `Recibimos el pago de tu pedido #${order.id}. Tu ebook (EPUB y PDF) y el audiolibro ya te esperan en `,
        { strong: 'Mi biblioteca' },
        ', listos para leer, descargar o escuchar.',
      ],
    },
    { type: 'button', label: 'Ir a Mi biblioteca', href: absoluteUrl('/biblioteca') },
    { type: 'subheading', text: `Detalle del pedido #${order.id}` },
    ...(date ? [{ type: 'paragraph', content: `Fecha: ${date}`, small: true } as Block] : []),
    { type: 'order', rows, totals },
  ]
  if (physical) {
    const lines = addressLines(order.shippingAddress)
    if (lines.length) blocks.push({ type: 'box', title: 'Enviaremos tu libro a', lines })
    blocks.push({
      type: 'paragraph',
      content: 'Te escribiremos de nuevo cuando tu libro impreso salga a despacho, con el número de seguimiento.',
    })
  }
  const invoiceUrl = externalUrl(order.invoice?.url)
  if (invoiceUrl)
    blocks.push({
      type: 'paragraph',
      content: [
        `Tu boleta electrónica${order.invoice?.folio ? ` N° ${order.invoice.folio}` : ''} ya está lista: `,
        { link: 'descárgala aquí', href: invoiceUrl },
        '.',
      ],
    })
  blocks.push({ type: 'paragraph', content: '¿Tienes dudas con tu compra? Responde este correo y te ayudamos.', small: true })

  return renderEmail({
    subject: `Compra confirmada: pedido #${order.id}`,
    preheader: physical
      ? 'Tu ebook y el audiolibro ya están en Mi biblioteca. Te avisaremos cuando despachemos tu libro.'
      : 'Tu ebook y el audiolibro ya están en Mi biblioteca.',
    blocks,
    reason: `Te escribimos por tu compra en ${SITE_NAME}.`,
    settings,
  })
}

/** (b) Pedido despachado (o listo para retiro). */
export function orderShippedEmail(
  args: { order: Order; titles: Record<string, string>; customerName?: string | null },
  settings?: EmailSettings,
): EmailContent {
  const { order, titles, customerName } = args
  const carrier = order.shipment?.carrier
  const tracking = order.shipment?.trackingCode?.trim()
  const pickup = carrier === 'Retiro'
  const books = order.items
    .filter((i) => i.format === 'fisico')
    .map((i) => {
      const id = String(typeof i.book === 'object' ? i.book.id : i.book)
      const title = (typeof i.book === 'object' && i.book.title) || titles[id] || 'Libro'
      return (i.quantity ?? 1) > 1 ? `${title} (×${i.quantity})` : title
    })

  const blocks: Block[] = [
    { type: 'heading', text: pickup ? 'Tu pedido está listo para retiro' : '¡Tu libro va en camino!' },
    { type: 'paragraph', content: greeting(customerName) },
    {
      type: 'paragraph',
      content: pickup
        ? `Tu pedido #${order.id} ya está listo. Responde este correo para coordinar el retiro.`
        : `Despachamos tu pedido #${order.id}. Con estos datos puedes seguir el envío en el sitio del courier:`,
    },
  ]
  if (!pickup)
    blocks.push({
      type: 'box',
      title: 'Datos del envío',
      lines: [
        [{ strong: 'Courier: ' }, carrier || 'Por confirmar'],
        [{ strong: 'N° de seguimiento: ' }, tracking || 'Por confirmar'],
      ],
    })
  if (books.length)
    blocks.push(
      { type: 'subheading', text: pickup ? 'Libros de tu pedido' : 'Libros en este envío' },
      { type: 'list', items: books },
    )
  const address = addressLines(order.shippingAddress)
  if (!pickup && address.length) blocks.push({ type: 'box', title: 'Dirección de entrega', lines: address })
  blocks.push(
    {
      type: 'paragraph',
      content: pickup
        ? 'Mientras tanto, tu ebook y el audiolibro ya están disponibles en Mi biblioteca.'
        : 'Mientras llega, tu ebook y el audiolibro siguen disponibles en Mi biblioteca.',
    },
    { type: 'button', label: 'Ver Mi biblioteca y mis pedidos', href: absoluteUrl('/biblioteca') },
    {
      type: 'paragraph',
      content: pickup
        ? '¿Tienes dudas? Responde este correo y te ayudamos.'
        : '¿Algún problema con la entrega? Responde este correo y lo revisamos.',
      small: true,
    },
  )

  return renderEmail({
    subject: pickup ? `Tu pedido #${order.id} está listo para retiro` : `Tu libro va en camino (pedido #${order.id})`,
    preheader: pickup
      ? 'Responde este correo para coordinar el retiro.'
      : `${carrier ?? 'Courier'} · N° de seguimiento ${tracking ?? 'por confirmar'}`,
    blocks,
    reason: `Te escribimos por tu compra en ${SITE_NAME}.`,
    settings,
  })
}

export const RESET_PASSWORD_SUBJECT = 'Cambia tu contraseña · La Polilla'

/** (c) Enlace para elegir una contraseña nueva. */
export function resetPasswordEmail(
  args: { url: string; name?: string | null; email?: string | null; expiresInMinutes: number },
  settings?: EmailSettings,
): EmailContent {
  const { url, name, email, expiresInMinutes } = args
  const expires =
    expiresInMinutes % 60 === 0
      ? `${expiresInMinutes / 60} ${expiresInMinutes === 60 ? 'hora' : 'horas'}`
      : `${expiresInMinutes} minutos`
  return renderEmail({
    subject: RESET_PASSWORD_SUBJECT,
    preheader: `Usa este enlace para elegir una contraseña nueva. Vence en ${expires}.`,
    blocks: [
      { type: 'heading', text: 'Elige una contraseña nueva' },
      { type: 'paragraph', content: greeting(name) },
      {
        type: 'paragraph',
        content: email
          ? ['Recibimos una solicitud para cambiar la contraseña de tu cuenta ', { strong: email }, ' en Editorial La Polilla.']
          : 'Recibimos una solicitud para cambiar la contraseña de tu cuenta en Editorial La Polilla.',
      },
      { type: 'button', label: 'Elegir contraseña nueva', href: url },
      { type: 'paragraph', content: `Por seguridad, el enlace vence en ${expires}.`, small: true },
      { type: 'linkFallback', href: url },
      {
        type: 'paragraph',
        content: 'Si no pediste este cambio, ignora este correo: tu contraseña actual sigue funcionando.',
        small: true,
      },
    ],
    reason: 'Te escribimos porque alguien pidió cambiar la contraseña de esta cuenta.',
    settings,
  })
}

/** (d) Bienvenida a una cuenta de cliente nueva. */
export function welcomeEmail(args: { name?: string | null; email?: string | null }, settings?: EmailSettings): EmailContent {
  return renderEmail({
    subject: 'Te damos la bienvenida a La Polilla',
    preheader: 'Todo lo que compres quedará en Mi biblioteca, con el audiolibro incluido.',
    blocks: [
      { type: 'heading', text: 'Te damos la bienvenida' },
      { type: 'paragraph', content: greeting(args.name) },
      {
        type: 'paragraph',
        content: args.email
          ? ['Ya tienes tu cuenta en Editorial La Polilla con el correo ', { strong: args.email }, '. Gracias por sumarte.']
          : 'Ya tienes tu cuenta en Editorial La Polilla. Gracias por sumarte.',
      },
      {
        type: 'list',
        items: [
          [{ strong: 'Todo queda en Mi biblioteca: ' }, 'cada libro que compres, con su ebook en EPUB y PDF.'],
          [{ strong: 'Audiolibro incluido: ' }, 'viene con cualquier compra, digital o impresa.'],
          [{ strong: 'Digital a todo el mundo, impreso en Chile: ' }, 'los libros físicos se envían dentro de Chile.'],
        ],
      },
      { type: 'button', label: 'Explorar el catálogo', href: absoluteUrl('/libros') },
      {
        type: 'paragraph',
        content: ['Puedes revisar tus datos cuando quieras en ', { link: 'Mi cuenta', href: absoluteUrl('/cuenta') }, '.'],
      },
      {
        type: 'paragraph',
        content: [
          '¿Necesitas una contraseña nueva? ',
          { link: 'Puedes elegirla aquí', href: absoluteUrl('/cuenta/recuperar') },
          '. Si no reconoces esta cuenta, responde este correo.',
        ],
        small: true,
      },
    ],
    reason: `Te escribimos porque se creó una cuenta en ${SITE_NAME} con este correo.`,
    settings,
  })
}
