import { getPayloadClient } from '@/lib/payload'
import {
  HONEYPOT_FIELD,
  MIN_FILL_MS,
  NEWSLETTER_SOURCES,
  oneLine,
  validateEmail,
  type NewsletterSource,
} from '@/lib/institucional/form-rules'
import { BodyError, checkFormToken, formReply, readFormBody, tokenProblem } from '@/lib/institucional/form-server'

const BACK = {
  inicio: { href: '/', label: 'Volver al inicio' },
  noticias: { href: '/blog', label: 'Volver a Noticias' },
  contacto: { href: '/contacto', label: 'Volver a Contacto' },
} as const
// Mismo mensaje si el email ya estaba inscrito: así no se revela quién está en la lista.
const SUCCESS = '¡Listo! Tu email quedó inscrito. Te escribiremos cuando haya libros nuevos, preventas o presentaciones.'

/** Inscribe un email en «Suscriptores del boletín». */
export async function POST(req: Request) {
  let body: Awaited<ReturnType<typeof readFormBody>>
  try {
    body = await readFormBody(req)
  } catch (e) {
    const error = e instanceof BodyError ? e.message : 'No pudimos leer los datos enviados.'
    return formReply(false, 400, { ok: false, code: 'invalid', error }, BACK.inicio)
  }
  const { data, isForm } = body
  const origen = (NEWSLETTER_SOURCES as readonly string[]).includes(data.origen) ? (data.origen as NewsletterSource) : 'inicio'
  const reply = (status: number, res: Parameters<typeof formReply>[2]) => formReply(isForm, status, res, BACK[origen])

  if (data[HONEYPOT_FIELD]) return reply(200, { ok: true, message: SUCCESS })

  const check = checkFormToken(data.token, MIN_FILL_MS.boletin)
  if (check !== 'ok') {
    const problem = tokenProblem(check)
    return reply(problem.status, problem.body)
  }

  const emailError = validateEmail(data.email)
  if (emailError) return reply(400, { ok: false, code: 'invalid', error: emailError, fields: { email: emailError } })

  const email = oneLine(data.email).toLowerCase()

  const payload = await getPayloadClient()
  try {
    const existing = await payload.find({
      collection: 'subscribers',
      overrideAccess: true,
      where: { email: { equals: email } },
      limit: 1,
      depth: 0,
    })
    if (!existing.docs.length) {
      try {
        await payload.create({ collection: 'subscribers', overrideAccess: true, data: { email, origen } })
      } catch (err) {
        // Dos envíos simultáneos del mismo email: el índice único rechaza el segundo, y está bien.
        const again = await payload.count({ collection: 'subscribers', overrideAccess: true, where: { email: { equals: email } } })
        if (!again.totalDocs) throw err
      }
    }
    return reply(200, { ok: true, message: SUCCESS })
  } catch (err) {
    payload.logger.error({ err }, 'No se pudo inscribir en el boletín')
    return reply(500, {
      ok: false,
      code: 'server',
      error: 'No pudimos inscribirte por un problema nuestro. Inténtalo de nuevo en unos minutos.',
    })
  }
}
