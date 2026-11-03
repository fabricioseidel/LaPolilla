import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { resendAdapter } from '@payloadcms/email-resend'
import type { EmailAdapter, Payload, SendEmailOptions } from 'payload'
import type { Order, User } from '../payload-types'
import {
  type EmailContent,
  type EmailSettings,
  htmlToText,
  orderPaidEmail,
  orderShippedEmail,
  resetPasswordEmail,
  welcomeEmail,
} from './email-templates'
import { absoluteUrl } from './seo'

// ---------------------------------------------------------------------------
// Adaptador de envío (se usa en payload.config.ts)
// ---------------------------------------------------------------------------
const FROM_NAME = 'Editorial La Polilla'

/** Acepta "hola@dominio.cl" o "Nombre <hola@dominio.cl>" y devuelve sólo la dirección. */
const fromAddress = (fallback: string) => {
  const raw = process.env.EMAIL_FROM?.trim()
  return raw?.match(/<([^>]+)>/)?.[1] ?? (raw || fallback)
}

/** Agrega una versión de texto plano a los correos que llegan sólo con HTML. */
const withTextVersion =
  (adapter: EmailAdapter): EmailAdapter =>
  (args) => {
    const inner = adapter(args)
    return {
      ...inner,
      sendEmail: (message) =>
        inner.sendEmail(
          !message.text && typeof message.html === 'string' ? { ...message, text: htmlToText(message.html) } : message,
        ),
    }
  }

/** "a@x.cl", { address }, o listas (anidadas) de ambos → "a@x.cl, b@y.cl". */
const recipients = (to: SendEmailOptions['to']): string => {
  if (!to) return ''
  if (Array.isArray(to)) return to.map((r) => recipients(r)).filter(Boolean).join(', ')
  return typeof to === 'object' ? (to.address ?? '') : to
}

/** Sin proveedor configurado: el correo no sale y queda en el registro (con su texto en desarrollo). */
const consoleAdapter: EmailAdapter = ({ payload }) => ({
  name: 'console',
  defaultFromAddress: fromAddress('hola@editoriallapolilla.cl'),
  defaultFromName: FROM_NAME,
  sendEmail: async (message) => {
    const head = `Correo NO enviado (configura SMTP_* o RESEND_API_KEY). Para: ${recipients(message.to)} · Asunto: ${message.subject}`
    if (process.env.NODE_ENV === 'production') return payload.logger.warn(head)
    const body = message.text || (typeof message.html === 'string' ? htmlToText(message.html) : '')
    payload.logger.info(`${head}\n\n${body}\n`)
  },
})

/**
 * Elige cómo se envían los correos, en este orden:
 * 1. SMTP (p. ej. Gmail) si están SMTP_HOST, SMTP_USER y SMTP_PASS. SMTP_PORT por defecto 465 (TLS).
 * 2. Resend si está RESEND_API_KEY.
 * 3. Consola: no se envían (útil en desarrollo).
 * El remitente es EMAIL_FROM con el nombre "Editorial La Polilla".
 */
export function emailAdapter(): EmailAdapter | Promise<EmailAdapter> {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, RESEND_API_KEY } = process.env
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    const port = Number(process.env.SMTP_PORT) || 465
    const gmail = /(^|\.)gmail\.com$/i.test(SMTP_HOST)
    return nodemailerAdapter({
      // Con Gmail el remitente debe ser la misma cuenta (o un alias verificado en Gmail).
      defaultFromAddress: fromAddress(SMTP_USER),
      defaultFromName: FROM_NAME,
      skipVerify: true, // no conectarse al servidor SMTP en cada arranque; los errores se registran al enviar
      transportOptions: {
        host: SMTP_HOST,
        port,
        secure: port === 465, // 465: TLS directo · 587: STARTTLS
        // Google muestra la contraseña de aplicación en grupos con espacios; no forman parte de ella.
        auth: { user: SMTP_USER, pass: gmail ? SMTP_PASS.replace(/\s+/g, '') : SMTP_PASS },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 20_000,
      },
    }).then(withTextVersion)
  }
  if (RESEND_API_KEY)
    return withTextVersion(
      resendAdapter({
        apiKey: RESEND_API_KEY,
        defaultFromAddress: fromAddress('hola@editoriallapolilla.cl'),
        defaultFromName: FROM_NAME,
      }),
    )
  return consoleAdapter
}

// ---------------------------------------------------------------------------
// Envío de cada correo
// ---------------------------------------------------------------------------
/** Lema, redes y correo de contacto de "Configuración del sitio" (si falla, el correo sale igual). */
async function emailSettings(payload: Payload): Promise<EmailSettings> {
  try {
    const s = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
    return { tagline: s.tagline, contactEmail: s.contactEmail, instagram: s.social?.instagram, youtube: s.social?.youtube }
  } catch (err) {
    payload.logger.warn({ err }, 'Correo: no se pudo leer la configuración del sitio')
    return {}
  }
}

/** Títulos de los libros del pedido que vienen sólo como id. */
async function bookTitles(payload: Payload, order: Order): Promise<Record<string, string>> {
  const ids = order.items.map((i) => i.book).filter((b): b is number => typeof b === 'number')
  if (!ids.length) return {}
  const res = await payload.find({
    collection: 'books',
    where: { id: { in: ids } },
    depth: 0,
    pagination: false,
    select: { title: true },
    overrideAccess: true,
  })
  return Object.fromEntries(res.docs.map((b) => [String(b.id), b.title]))
}

const customerName = (order: Order) =>
  (typeof order.user === 'object' && order.user?.name) || order.shippingAddress?.name || undefined

async function send(payload: Payload, to: string, email: EmailContent, settings: EmailSettings) {
  await payload.sendEmail({
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
    // Las respuestas de los clientes llegan al correo de contacto, si está configurado.
    ...(settings.contactEmail ? { replyTo: settings.contactEmail } : {}),
  })
}

/** Compra confirmada. Lanza error si no se pudo enviar (quien llama lo registra). */
export async function sendOrderPaidEmail(payload: Payload, order: Order) {
  const [settings, titles] = await Promise.all([emailSettings(payload), bookTitles(payload, order)])
  await send(payload, order.email, orderPaidEmail({ order, titles, customerName: customerName(order) }, settings), settings)
}

/**
 * Pedido despachado. Nunca lanza error: un problema con el correo no debe impedir
 * que la editora marque el pedido como "Enviado" (queda en el registro).
 */
export async function sendShippedEmail(payload: Payload, order: Order) {
  try {
    const [settings, titles] = await Promise.all([emailSettings(payload), bookTitles(payload, order)])
    await send(payload, order.email, orderShippedEmail({ order, titles, customerName: customerName(order) }, settings), settings)
  } catch (err) {
    payload.logger.error({ err, orderId: order.id }, 'No se pudo enviar el correo de despacho')
  }
}

/** Bienvenida a una cuenta de cliente nueva. */
export async function sendWelcomeEmail(payload: Payload, user: Pick<User, 'email' | 'name'>) {
  const settings = await emailSettings(payload)
  await send(payload, user.email, welcomeEmail({ name: user.name, email: user.email }, settings), settings)
}

/** HTML del correo "olvidé mi contraseña" (lo envía Payload desde auth.forgotPassword de Users). */
export async function resetPasswordEmailHTML(
  payload: Payload | undefined,
  args: { token?: string; user?: Pick<User, 'email' | 'name'> | null; expiresInMinutes: number },
) {
  const settings = payload ? await emailSettings(payload) : {}
  const url = absoluteUrl(`/cuenta/restablecer?token=${encodeURIComponent(args.token ?? '')}`)
  return resetPasswordEmail(
    { url, name: args.user?.name, email: args.user?.email, expiresInMinutes: args.expiresInMinutes },
    settings,
  ).html
}
