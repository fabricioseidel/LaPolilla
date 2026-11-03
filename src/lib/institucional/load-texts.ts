import { getPayloadClient } from '@/lib/payload'
import { hasPlaceholders, hasRichText, type RichTextData } from './richtext'
import {
  defaultFaq,
  defaultNosotros,
  defaultPrivacidad,
  defaultTerminos,
  getTextContext,
  type FaqItem,
  type TextContext,
} from './textos'

type RichKey = 'nosotros' | 'terminos' | 'privacidad'

const TEMPLATES: Record<RichKey, (ctx: TextContext) => RichTextData> = {
  nosotros: () => defaultNosotros(),
  terminos: defaultTerminos,
  privacidad: defaultPrivacidad,
}

/**
 * Texto de una página institucional desde «Textos del sitio».
 * Si está vacío, devuelve la plantilla. `pending` indica si todavía hay datos por completar
 * (es la plantilla o quedan marcadores [ ]), para mostrar el aviso de revisión.
 */
export async function loadRichText(key: RichKey) {
  const payload = await getPayloadClient()
  const [texts, ctx] = await Promise.all([
    payload.findGlobal({ slug: 'site-texts', depth: 1, select: { [key]: true } }).catch(() => null),
    getTextContext(payload),
  ])
  const saved = texts?.[key]
  const data: RichTextData = hasRichText(saved) ? saved : TEMPLATES[key](ctx)
  return { data, pending: !hasRichText(saved) || hasPlaceholders(data) }
}

/** Preguntas frecuentes guardadas, o las preguntas por defecto si la lista está vacía. */
export async function loadFaq(): Promise<FaqItem[]> {
  const payload = await getPayloadClient()
  const [texts, ctx] = await Promise.all([
    payload.findGlobal({ slug: 'site-texts', depth: 0, select: { faq: true } }).catch(() => null),
    getTextContext(payload),
  ])
  const saved = (texts?.faq ?? []).filter((i) => i.pregunta?.trim() && i.respuesta?.trim())
  return saved.length ? saved.map(({ pregunta, respuesta }) => ({ pregunta, respuesta })) : defaultFaq(ctx)
}
