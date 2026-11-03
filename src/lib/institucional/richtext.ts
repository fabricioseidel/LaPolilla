/**
 * Utilidades para el texto enriquecido (Lexical) de Payload, sin dependencias de React:
 * - construir contenido por defecto con una sintaxis mínima (`toLexical`),
 * - saber si un campo quedó vacío, extraer texto plano y detectar marcadores [ ].
 */

/** Forma serializada que Payload guarda en los campos richText. */
export type RichTextData = {
  root: {
    type: string
    children: { type: any; version: number; [k: string]: unknown }[]
    direction: ('ltr' | 'rtl') | null
    format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | ''
    indent: number
    version: number
  }
  [k: string]: unknown
}

type AnyNode = { type?: string; text?: unknown; tag?: unknown; children?: unknown; [k: string]: unknown }

// ---------------------------------------------------------------------------
// Construcción
// ---------------------------------------------------------------------------

/** Texto en línea: texto simple, negrita, cursiva o enlace. */
export type Inline = string | { b: string } | { i: string } | { a: string; href: string }
export type Block = { h2: string } | { h3: string } | { p: Inline | Inline[] } | { ul: (Inline | Inline[])[] }

const element = { direction: 'ltr' as const, format: '' as const, indent: 0, version: 1 }

const textNode = (text: string, format = 0) => ({
  type: 'text',
  text,
  detail: 0,
  format, // 1 = negrita, 2 = cursiva
  mode: 'normal',
  style: '',
  version: 1,
})

const inlineNodes = (content: Inline | Inline[]) =>
  (Array.isArray(content) ? content : [content]).map((part) => {
    if (typeof part === 'string') return textNode(part)
    if ('b' in part) return textNode(part.b, 1)
    if ('i' in part) return textNode(part.i, 2)
    return {
      ...element,
      type: 'link',
      version: 3,
      fields: { linkType: 'custom', url: part.href, newTab: false },
      children: [textNode(part.a)],
    }
  })

/** Convierte una lista simple de bloques al formato que guarda el editor de Payload. */
export function toLexical(blocks: Block[]): RichTextData {
  const children = blocks.map((block) => {
    if ('h2' in block) return { ...element, type: 'heading', tag: 'h2', children: [textNode(block.h2)] }
    if ('h3' in block) return { ...element, type: 'heading', tag: 'h3', children: [textNode(block.h3)] }
    if ('p' in block) return { ...element, type: 'paragraph', textFormat: 0, textStyle: '', children: inlineNodes(block.p) }
    return {
      ...element,
      type: 'list',
      listType: 'bullet',
      tag: 'ul',
      start: 1,
      children: block.ul.map((item, i) => ({ ...element, type: 'listitem', value: i + 1, children: inlineNodes(item) })),
    }
  })
  return { root: { ...element, type: 'root', children } }
}

// ---------------------------------------------------------------------------
// Lectura
// ---------------------------------------------------------------------------

const childrenOf = (node: AnyNode): AnyNode[] => (Array.isArray(node.children) ? (node.children as AnyNode[]) : [])

const rootOf = (data: unknown): AnyNode | undefined => {
  if (!data || typeof data !== 'object' || !('root' in data)) return undefined
  const root = (data as { root?: unknown }).root
  return root && typeof root === 'object' ? (root as AnyNode) : undefined
}

/** Nodos que cuentan como contenido aunque no tengan texto. */
const CONTENT_NODES = new Set(['upload', 'relationship', 'horizontalrule', 'block', 'inlineBlock'])

/** ¿El campo tiene contenido real? (un editor vaciado deja un párrafo sin texto) */
export function hasRichText(data: unknown): data is RichTextData {
  const root = rootOf(data)
  if (!root) return false
  const visit = (node: AnyNode): boolean =>
    (node.type === 'text' && typeof node.text === 'string' && node.text.trim() !== '') ||
    CONTENT_NODES.has(node.type ?? '') ||
    childrenOf(node).some(visit)
  return visit(root)
}

/** Texto plano de un nodo (o de todo el documento), con espacios entre bloques. */
export function nodeText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as AnyNode
  if (n.type === 'text' && typeof n.text === 'string') return n.text
  if (n.type === 'linebreak') return '\n'
  const parts = childrenOf(n).map(nodeText)
  const isBlockContainer = n.type === 'root' || n.type === 'list'
  return parts.join(isBlockContainer ? '\n' : '')
}

export const plainText = (data: unknown) => {
  const root = rootOf(data)
  return root ? nodeText(root).replace(/[ \t]+/g, ' ').trim() : ''
}

/** Recorta un texto en el último espacio antes de `max` caracteres. */
export function excerpt(text: string, max = 260) {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max * 0.6)).replace(/[\s,;:.—-]+$/, '')}…`
}

/** Marcadores por completar, como [RUT] o [email de contacto]. */
export const PLACEHOLDER = /\[[^[\]\n]{2,120}\]/

export const hasPlaceholders = (data: unknown) => PLACEHOLDER.test(plainText(data))

// ---------------------------------------------------------------------------
// Títulos con ancla (para el índice de las páginas legales)
// ---------------------------------------------------------------------------

export const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

/** Genera ids únicos y estables para los títulos, en orden de aparición. */
export function headingIdFactory() {
  const seen = new Map<string, number>()
  return (text: string) => {
    const base = slugify(text) || 'seccion'
    const n = (seen.get(base) ?? 0) + 1
    seen.set(base, n)
    return n === 1 ? base : `${base}-${n}`
  }
}

/** Títulos de primer nivel del documento (h1/h2 del editor), con el mismo id que se usa al dibujarlos. */
export function headingsOf(data: unknown): { id: string; text: string }[] {
  const root = rootOf(data)
  if (!root) return []
  const nextId = headingIdFactory()
  const out: { id: string; text: string }[] = []
  for (const node of childrenOf(root)) {
    if (node.type !== 'heading') continue
    const text = nodeText(node).trim()
    if (!text) continue
    const id = nextId(text)
    if (node.tag === 'h1' || node.tag === 'h2') out.push({ id, text })
  }
  return out
}
