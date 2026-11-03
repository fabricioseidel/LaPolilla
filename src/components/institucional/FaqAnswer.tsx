import Link from 'next/link'
import type { ReactNode } from 'react'

/** Frases que se enlazan solas a su página, para que las respuestas (texto simple) igual tengan enlaces. */
const PAGES: Record<string, string> = {
  'Mi biblioteca': '/biblioteca',
  'Términos y condiciones': '/terminos',
  'página de Contacto': '/contacto',
  'página de contacto': '/contacto',
  'política de privacidad': '/privacidad',
  'Política de privacidad': '/privacidad',
}

const TOKEN = new RegExp(
  [
    '(https?:\\/\\/[^\\s<>]+[^\\s<>.,;:!?)»"\'])', // URL
    '([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,})', // email
    `(${Object.keys(PAGES).join('|')})`, // páginas del sitio
  ].join('|'),
  'g',
)

/** Convierte URLs, emails y nombres de páginas en enlaces (cada página, una sola vez por respuesta). */
function linkify(text: string, linked: Set<string>): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  for (const m of text.matchAll(TOKEN)) {
    const [full, url, email, page] = m
    const start = m.index ?? 0
    let node: ReactNode = null
    if (url) node = <a href={url}>{url}</a>
    else if (email) node = <a href={`mailto:${email}`}>{email}</a>
    else if (page && !linked.has(PAGES[page])) {
      linked.add(PAGES[page])
      node = <Link href={PAGES[page]}>{page}</Link>
    }
    if (!node) continue
    if (start > last) out.push(text.slice(last, start))
    out.push(<span key={start}>{node}</span>)
    last = start + full.length
  }
  out.push(text.slice(last))
  return out
}

const BULLET = /^\s*[•\-–*]\s+/

/**
 * Respuesta de una pregunta frecuente (campo de texto simple del panel):
 * una línea en blanco separa párrafos y las líneas que empiezan con «• » forman una lista.
 */
export function FaqAnswer({ text }: { text: string }) {
  const linked = new Set<string>()
  const blocks = text
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split('\n')
        if (lines.every((l) => BULLET.test(l)))
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{linkify(l.replace(BULLET, ''), linked)}</li>
              ))}
            </ul>
          )
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {linkify(l, linked)}
              </span>
            ))}
          </p>
        )
      })}
    </>
  )
}
