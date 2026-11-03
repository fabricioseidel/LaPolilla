import { getPayloadClient } from '@/lib/payload'
import { HONEYPOT_FIELD, LIMITS, MIN_FILL_MS, multiLine, oneLine, validateContact } from '@/lib/institucional/form-rules'
import { BodyError, checkFormToken, escapeHtml, formReply, readFormBody, tokenProblem } from '@/lib/institucional/form-server'

const BACK = { href: '/contacto', label: 'Volver a Contacto' }
const SUCCESS = '¡Gracias por escribirnos! Recibimos tu mensaje y te responderemos a tu email lo antes posible.'
/** Máximo de mensajes desde un mismo email en la ventana de tiempo. */
const RATE = { max: 3, minutes: 10 }

/** Recibe el formulario de /contacto: valida, guarda en «Mensajes de contacto» y avisa por email al equipo. */
export async function POST(req: Request) {
  let body: Awaited<ReturnType<typeof readFormBody>>
  try {
    body = await readFormBody(req)
  } catch (e) {
    const error = e instanceof BodyError ? e.message : 'No pudimos leer los datos enviados.'
    return formReply(false, 400, { ok: false, code: 'invalid', error }, BACK)
  }
  const { data, isForm } = body
  const reply = (status: number, res: Parameters<typeof formReply>[2]) => formReply(isForm, status, res, BACK)

  // Campo trampa lleno: es un robot. Respondemos como si todo saliera bien, sin guardar nada.
  if (data[HONEYPOT_FIELD]) return reply(200, { ok: true, message: SUCCESS })

  const check = checkFormToken(data.token, MIN_FILL_MS.contacto)
  if (check !== 'ok') {
    const problem = tokenProblem(check)
    return reply(problem.status, problem.body)
  }

  const fields = validateContact(data)
  if (Object.keys(fields).length)
    return reply(400, { ok: false, code: 'invalid', error: 'Revisa los campos marcados.', fields })

  const message = {
    nombre: oneLine(data.nombre).slice(0, LIMITS.nombre),
    email: oneLine(data.email).toLowerCase(),
    asunto: oneLine(data.asunto).slice(0, LIMITS.asunto),
    mensaje: multiLine(data.mensaje).slice(0, LIMITS.mensaje),
  }

  const payload = await getPayloadClient()
  try {
    const since = new Date(Date.now() - RATE.minutes * 60_000).toISOString()
    const recent = await payload.count({
      collection: 'messages',
      overrideAccess: true,
      where: { and: [{ email: { equals: message.email } }, { createdAt: { greater_than: since } }] },
    })
    if (recent.totalDocs >= RATE.max)
      return reply(429, {
        ok: false,
        code: 'limit',
        error: 'Ya recibimos varios mensajes tuyos hace poco. Espera unos minutos antes de enviar otro.',
      })

    const doc = await payload.create({ collection: 'messages', overrideAccess: true, data: { ...message, estado: 'nuevo' } })

    // Aviso al equipo. Sin adaptador de correo (desarrollo), Payload lo muestra en la consola.
    try {
      const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
      if (settings.contactEmail) {
        const site = process.env.NEXT_PUBLIC_SITE_URL ?? ''
        const adminUrl = `${site}/admin/collections/messages/${doc.id}`
        await payload.sendEmail({
          to: settings.contactEmail,
          replyTo: message.email,
          subject: `Nuevo mensaje de contacto: ${message.asunto}`,
          text: `${message.nombre} <${message.email}> escribió:\n\n${message.mensaje}\n\nResponde a este correo para contestarle.\nVer en el panel: ${adminUrl}`,
          html: `
            <p><strong>${escapeHtml(message.nombre)}</strong> (${escapeHtml(message.email)}) escribió desde el formulario de contacto:</p>
            <p><strong>Asunto:</strong> ${escapeHtml(message.asunto)}</p>
            <blockquote style="border-left:3px solid #9C86C9;margin:0;padding:4px 12px">${escapeHtml(message.mensaje).replace(/\n/g, '<br>')}</blockquote>
            <p>Responde a este correo para contestarle directamente.</p>
            <p><a href="${escapeHtml(adminUrl)}">Ver el mensaje en el panel</a></p>`,
        })
      }
    } catch (err) {
      payload.logger.error({ err, messageId: doc.id }, 'No se pudo enviar el aviso del mensaje de contacto')
    }

    return reply(200, { ok: true, message: SUCCESS })
  } catch (err) {
    payload.logger.error({ err }, 'No se pudo guardar el mensaje de contacto')
    return reply(500, {
      ok: false,
      code: 'server',
      error: 'No pudimos enviar tu mensaje por un problema nuestro. Inténtalo de nuevo en unos minutos.',
    })
  }
}
