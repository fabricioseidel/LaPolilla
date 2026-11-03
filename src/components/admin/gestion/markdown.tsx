import type { ReactNode } from 'react'

/**
 * Markdown mínimo para mostrar docs/GUIA-EDITORIAL.md dentro del panel, sin dependencias.
 * Soporta: títulos (#..####), párrafos, listas (con un nivel de anidación), citas (>),
 * tablas simples, separadores (---), **negrita**, *cursiva*, `código` y [enlaces](url).
 * Genera elementos de React (nunca HTML crudo).
 */
type Lista = { tipo: 'lista'; ordenada: boolean; inicio: number; items: { texto: string; sub?: Lista }[] }
export type Bloque =
  | { tipo: 'titulo'; nivel: number; texto: string; id: string }
  | { tipo: 'parrafo'; texto: string }
  | Lista
  | { tipo: 'cita'; bloques: Bloque[] }
  | { tipo: 'tabla'; cabecera: string[]; filas: string[][] }
  | { tipo: 'separador' }

const RE_TITULO = /^(#{1,4})\s+(.+?)\s*#*\s*$/
const RE_ITEM = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/
const RE_SEPARADOR = /^\s*(-{3,}|\*{3,}|_{3,})\s*$/
const inicioDeBloque = (l: string) => RE_TITULO.test(l) || RE_ITEM.test(l) || RE_SEPARADOR.test(l) || /^\s*[>|]/.test(l)

export const ancla = (texto: string) =>
  texto
    .replace(/[*`[\]()]/g, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const sangria = (l: string) => l.match(/^\s*/)?.[0].replace(/\t/g, '    ').length ?? 0
const celdas = (l: string) =>
  l
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => c.trim())

function leerLista(lineas: string[], desde: number): { lista: Lista; siguiente: number } {
  const primera = lineas[desde].match(RE_ITEM)!
  const base = sangria(lineas[desde])
  const ordenada = /\d/.test(primera[2])
  const lista: Lista = { tipo: 'lista', ordenada, inicio: ordenada ? parseInt(primera[2], 10) : 1, items: [] }
  let i = desde
  while (i < lineas.length) {
    const l = lineas[i]
    if (!l.trim()) {
      // Una línea en blanco sólo continúa la lista si sigue otro ítem del mismo nivel o más adentro.
      let j = i + 1
      while (j < lineas.length && !lineas[j].trim()) j++
      const m = lineas[j]?.match(RE_ITEM)
      if (m && sangria(lineas[j]) >= base) {
        i = j
        continue
      }
      break
    }
    const m = l.match(RE_ITEM)
    const s = sangria(l)
    if (m && s === base) {
      lista.items.push({ texto: m[3].trim() })
      i++
    } else if (m && s > base && lista.items.length) {
      const sub = leerLista(lineas, i)
      lista.items[lista.items.length - 1].sub = sub.lista
      i = sub.siguiente
    } else if (!m && s > base && lista.items.length) {
      lista.items[lista.items.length - 1].texto += ' ' + l.trim()
      i++
    } else break
  }
  return { lista, siguiente: i }
}

export function leerMarkdown(md: string): Bloque[] {
  const lineas = md.replace(/\r\n?/g, '\n').split('\n')
  const bloques: Bloque[] = []
  let i = 0
  while (i < lineas.length) {
    const l = lineas[i]
    if (!l.trim() || /^\s*<!--.*-->\s*$/.test(l)) {
      i++
      continue
    }
    const t = l.match(RE_TITULO)
    if (t) {
      bloques.push({ tipo: 'titulo', nivel: t[1].length, texto: t[2], id: ancla(t[2]) })
      i++
    } else if (RE_SEPARADOR.test(l)) {
      bloques.push({ tipo: 'separador' })
      i++
    } else if (/^\s*>/.test(l)) {
      const dentro: string[] = []
      while (i < lineas.length && /^\s*>/.test(lineas[i])) dentro.push(lineas[i++].replace(/^\s*>\s?/, ''))
      bloques.push({ tipo: 'cita', bloques: leerMarkdown(dentro.join('\n')) })
    } else if (/^\s*\|/.test(l)) {
      const filas: string[][] = []
      while (i < lineas.length && /^\s*\|/.test(lineas[i])) filas.push(celdas(lineas[i++]))
      const separador = filas[1]?.every((c) => /^:?-{2,}:?$/.test(c))
      bloques.push({ tipo: 'tabla', cabecera: filas[0], filas: filas.slice(separador ? 2 : 1) })
    } else if (RE_ITEM.test(l)) {
      const { lista, siguiente } = leerLista(lineas, i)
      bloques.push(lista)
      i = siguiente
    } else {
      const texto = [l.trim()]
      i++
      while (i < lineas.length && lineas[i].trim() && !inicioDeBloque(lineas[i])) texto.push(lineas[i++].trim())
      bloques.push({ tipo: 'parrafo', texto: texto.join(' ') })
    }
  }
  return bloques
}

const RE_EN_LINEA = /\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g

function enlace(texto: string, href: string, key: string) {
  if (!/^(https?:\/\/|mailto:|\/|#)/.test(href)) return <span key={key}>{enLinea(texto, key)}</span>
  const externo = /^https?:\/\//.test(href)
  return (
    <a key={key} href={href} {...(externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {enLinea(texto, key)}
      {externo && <span className="lp-sr"> (se abre en una pestaña nueva)</span>}
    </a>
  )
}

export function enLinea(texto: string, clave = 'l'): ReactNode[] {
  const nodos: ReactNode[] = []
  let ultimo = 0
  let n = 0
  for (const m of texto.matchAll(RE_EN_LINEA)) {
    const pos = m.index ?? 0
    if (pos > ultimo) nodos.push(texto.slice(ultimo, pos))
    const key = `${clave}-${n++}`
    if (m[1] !== undefined) nodos.push(<strong key={key}>{enLinea(m[1], key)}</strong>)
    else if (m[2] !== undefined) nodos.push(<em key={key}>{enLinea(m[2], key)}</em>)
    else if (m[3] !== undefined) nodos.push(<code key={key}>{m[3]}</code>)
    else nodos.push(enlace(m[4], m[5], key))
    ultimo = pos + m[0].length
  }
  if (ultimo < texto.length) nodos.push(texto.slice(ultimo))
  return nodos
}

function ListaMd({ lista, clave }: { lista: Lista; clave: string }) {
  const items = lista.items.map((it, i) => (
    <li key={i}>
      {enLinea(it.texto, `${clave}-${i}`)}
      {it.sub && <ListaMd lista={it.sub} clave={`${clave}-${i}-s`} />}
    </li>
  ))
  return lista.ordenada ? <ol start={lista.inicio !== 1 ? lista.inicio : undefined}>{items}</ol> : <ul>{items}</ul>
}

export function Markdown({ bloques, clave = 'b' }: { bloques: Bloque[]; clave?: string }) {
  return (
    <>
      {bloques.map((b, i) => {
        const k = `${clave}-${i}`
        switch (b.tipo) {
          case 'titulo': {
            const contenido = enLinea(b.texto, k)
            if (b.nivel === 1) return <h1 key={k}>{contenido}</h1>
            if (b.nivel === 2) return <h2 key={k} id={b.id}>{contenido}</h2>
            if (b.nivel === 3) return <h3 key={k} id={b.id}>{contenido}</h3>
            return <h4 key={k}>{contenido}</h4>
          }
          case 'parrafo':
            return <p key={k}>{enLinea(b.texto, k)}</p>
          case 'lista':
            return <ListaMd key={k} lista={b} clave={k} />
          case 'cita':
            return (
              <blockquote key={k}>
                <Markdown bloques={b.bloques} clave={k} />
              </blockquote>
            )
          case 'tabla':
            return (
              <div key={k} className="lp-tabla">
                <table>
                  <thead>
                    <tr>
                      {b.cabecera.map((c, j) => (
                        <th key={j} scope="col">
                          {enLinea(c, `${k}-h${j}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.filas.map((f, j) => (
                      <tr key={j}>
                        {f.map((c, x) => (
                          <td key={x}>{enLinea(c, `${k}-${j}-${x}`)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          case 'separador':
            return <hr key={k} />
        }
      })}
    </>
  )
}
