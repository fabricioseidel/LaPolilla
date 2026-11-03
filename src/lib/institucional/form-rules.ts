/**
 * Reglas de los formularios de contacto y boletín, compartidas por el navegador y el servidor.
 * (Sin dependencias de Node: se importa también desde componentes de cliente.)
 */

/** Campo trampa: invisible para las personas; los robots suelen llenarlo. */
export const HONEYPOT_FIELD = 'sitio_web'

/** Tiempo mínimo (ms) entre que se muestra el formulario y se envía. */
export const MIN_FILL_MS = { contacto: 4000, boletin: 2000 } as const

export const LIMITS = { nombre: 100, email: 254, asunto: 150, mensaje: 5000 } as const

/** Lugares del sitio desde donde alguien puede inscribirse al boletín. */
export const NEWSLETTER_SOURCES = ['inicio', 'noticias', 'contacto'] as const
export type NewsletterSource = (typeof NEWSLETTER_SOURCES)[number]

const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/

/** Texto de una línea: sin saltos ni espacios repetidos. */
export const oneLine = (v: unknown) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '')
/** Texto de varias líneas: normaliza saltos y quita espacios sobrantes. */
export const multiLine = (v: unknown) =>
  typeof v === 'string' ? v.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim() : ''

export const isEmail = (email: string) => email.length <= LIMITS.email && EMAIL_RE.test(email)

export type FieldErrors = Partial<Record<'nombre' | 'email' | 'asunto' | 'mensaje', string>>

export function validateEmail(raw: unknown): string | undefined {
  const email = oneLine(raw)
  if (!email) return 'Escribe tu email.'
  if (!isEmail(email)) return 'Revisa tu email: debe ser como nombre@correo.cl.'
}

export function validateContact(data: Record<string, unknown>): FieldErrors {
  const errors: FieldErrors = {}
  const nombre = oneLine(data.nombre)
  const asunto = oneLine(data.asunto)
  const mensaje = multiLine(data.mensaje)

  if (nombre.length < 2) errors.nombre = 'Escribe tu nombre.'
  else if (nombre.length > LIMITS.nombre) errors.nombre = `Tu nombre puede tener hasta ${LIMITS.nombre} caracteres.`

  const emailError = validateEmail(data.email)
  if (emailError) errors.email = emailError

  if (asunto.length < 3) errors.asunto = 'Escribe un asunto breve, por ejemplo «Consulta por un pedido».'
  else if (asunto.length > LIMITS.asunto) errors.asunto = `El asunto puede tener hasta ${LIMITS.asunto} caracteres.`

  if (mensaje.length < 10) errors.mensaje = 'Tu mensaje es muy corto: cuéntanos un poco más.'
  else if (mensaje.length > LIMITS.mensaje) errors.mensaje = 'Tu mensaje es muy largo: puede tener hasta 5.000 caracteres.'

  return errors
}

/** Respuesta de /api/contacto y /api/newsletter. */
export type FormResponse = {
  ok: boolean
  message?: string
  error?: string
  /** invalid: datos con errores · expired: formulario vencido · too_fast: enviado demasiado rápido · limit: demasiados envíos */
  code?: 'invalid' | 'expired' | 'too_fast' | 'limit' | 'server'
  fields?: FieldErrors
  token?: string
}
