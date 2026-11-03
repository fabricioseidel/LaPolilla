import type { ReactNode } from 'react'
import { headingsOf, type RichTextData } from '@/lib/institucional/richtext'
import { IconChevron, IconQuestion } from './Icons'
import { RichTextContent } from './RichTextContent'

function Toc({ items }: { items: { id: string; text: string }[] }) {
  return (
    <ol>
      {items.map((h) => (
        <li key={h.id}>
          <a href={`#${h.id}`}>{h.text}</a>
        </li>
      ))}
    </ol>
  )
}

/**
 * Documento legal (términos, privacidad): aviso mientras sea plantilla o tenga datos por completar,
 * índice de secciones y texto con estilo de lectura.
 */
export function LegalDocument({ data, notice }: { data: RichTextData; notice?: ReactNode }) {
  const toc = headingsOf(data)
  const showToc = toc.length >= 3
  return (
    <>
      {notice && (
        <aside className="legal-notice" aria-label="Aviso sobre este texto">
          <IconQuestion size={24} />
          <div>{notice}</div>
        </aside>
      )}
      <div className={showToc ? 'legal-layout' : undefined}>
        {showToc && (
          <>
            <nav className="legal-toc legal-toc-desktop" aria-label="Índice de esta página">
              <p className="legal-toc-title">En esta página</p>
              <Toc items={toc} />
            </nav>
            <details className="legal-toc legal-toc-mobile">
              <summary>
                Índice de esta página <IconChevron size={20} />
              </summary>
              <nav aria-label="Índice de esta página">
                <Toc items={toc} />
              </nav>
            </details>
          </>
        )}
        <RichTextContent data={data} />
      </div>
    </>
  )
}
