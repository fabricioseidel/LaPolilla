import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter, SetStepNav } from '@payloadcms/ui'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Markdown, enLinea, leerMarkdown } from './markdown'
import './gestion.css'

/** La guía se escribe en docs/GUIA-EDITORIAL.md (una sola fuente para el repositorio y el panel). */
const leerGuia = () => readFile(join(process.cwd(), 'docs/GUIA-EDITORIAL.md'), 'utf8').catch(() => '')

/** Vista /admin/guia: la guía de uso del panel, con índice. */
export default async function GuiaView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, locale, permissions, visibleEntities } = initPageResult
  const guia = await leerGuia()
  const bloques = leerMarkdown(guia)
  const primerH2 = bloques.findIndex((b) => b.tipo === 'titulo' && b.nivel === 2)
  const corte = primerH2 === -1 ? bloques.length : primerH2
  const secciones = bloques.flatMap((b) => (b.tipo === 'titulo' && b.nivel === 2 ? [b] : []))

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      req={req}
      searchParams={searchParams}
      user={req.user ?? undefined}
      visibleEntities={visibleEntities}
    >
      <SetStepNav nav={[{ label: 'Guía de uso' }]} />
      <Gutter className="lp-gestion lp-guia">
        <article className="lp-guia__cuerpo">
          {guia ? (
            <>
              <Markdown bloques={bloques.slice(0, corte)} clave="intro" />
              {secciones.length > 1 && (
                <nav className="lp-guia__indice" aria-labelledby="lp-guia-indice">
                  <p id="lp-guia-indice">En esta guía</p>
                  <ol>
                    {secciones.map((s) => (
                      <li key={s.id}>
                        <a href={`#${s.id}`}>{enLinea(s.texto, s.id)}</a>
                      </li>
                    ))}
                  </ol>
                </nav>
              )}
              <Markdown bloques={bloques.slice(corte)} clave="resto" />
            </>
          ) : (
            <>
              <h1>Guía de uso</h1>
              <p>No se pudo cargar la guía (docs/GUIA-EDITORIAL.md).</p>
            </>
          )}
        </article>
      </Gutter>
    </DefaultTemplate>
  )
}
