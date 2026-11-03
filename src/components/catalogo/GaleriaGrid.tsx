'use client'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import '@/app/(frontend)/styles/catalogo.css'
import type { ImageProps } from './libro'

export type GaleriaItem = {
  id: number
  title: string
  artist: string | null
  description: string | null
  thumb: ImageProps
  big: ImageProps
  book: { title: string; slug: string } | null
}

/**
 * Cuadrícula tipo mampostería. Cada ilustración enlaza a /galeria/[id] (funciona sin JS);
 * con JS se abre en un <dialog> modal: el foco queda dentro, Esc o el botón lo cierran,
 * las flechas ← → pasan de ilustración y al cerrar el foco vuelve a la miniatura.
 */
export function GaleriaGrid({ items }: { items: GaleriaItem[] }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [index, setIndex] = useState<number | null>(null)
  const current = index === null ? null : items[index]

  useEffect(() => {
    const d = dialog.current
    if (index !== null && d && !d.open) d.showModal()
  }, [index])

  const go = useCallback(
    (delta: number) => setIndex((i) => (i === null ? i : (i + delta + items.length) % items.length)),
    [items.length],
  )

  const onClose = () => {
    const id = current?.id
    setIndex(null)
    if (id != null) document.querySelector<HTMLElement>(`[data-galeria-id="${id}"]`)?.focus()
  }

  return (
    <>
      <ul className="galeria-grid" role="list">
        {items.map((it, i) => (
          <li key={it.id} className="galeria-item">
            <figure>
              <a
                href={`/galeria/${it.id}`}
                className="galeria-enlace"
                data-galeria-id={it.id}
                aria-haspopup="dialog"
                onClick={(e) => {
                  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
                  e.preventDefault()
                  setIndex(i)
                }}
              >
                <img
                  src={it.thumb.src}
                  srcSet={it.thumb.srcSet}
                  sizes="(min-width: 1120px) 360px, (min-width: 720px) 33vw, 50vw"
                  width={it.thumb.width}
                  height={it.thumb.height}
                  alt={it.thumb.alt}
                  loading={i < 6 ? 'eager' : 'lazy'}
                  decoding="async"
                />
                <span className="cat-sr">: ver en grande</span>
              </a>
              <figcaption className="galeria-pie">
                <span className="galeria-titulo">{it.title}</span>
                {it.artist && <span className="galeria-artista">por {it.artist}</span>}
                {it.book && (
                  <Link className="galeria-libro" href={`/libros/${it.book.slug}`}>
                    Del libro «{it.book.title}»
                  </Link>
                )}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        className="galeria-visor"
        aria-labelledby="galeria-visor-titulo"
        onClose={onClose}
        onClick={(e) => {
          // Clic en el fondo oscuro (fuera del contenido) cierra el visor.
          if (e.target === dialog.current) dialog.current.close()
        }}
        onKeyDown={(e) => {
          if (items.length < 2) return
          if (e.key === 'ArrowRight') go(1)
          if (e.key === 'ArrowLeft') go(-1)
        }}
      >
        {current && (
          <div className="galeria-visor-cuerpo">
            <button type="button" className="galeria-visor-cerrar" onClick={() => dialog.current?.close()} aria-label="Cerrar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
            <div className="galeria-visor-imagen">
              <img
                key={current.id}
                src={current.big.src}
                srcSet={current.big.srcSet}
                sizes="(min-width: 900px) 860px, 100vw"
                width={current.big.width}
                height={current.big.height}
                alt={current.big.alt}
              />
            </div>
            <div className="galeria-visor-info">
              <p className="cat-eyebrow">Ilustración</p>
              <h2 id="galeria-visor-titulo">{current.title}</h2>
              {current.artist && <p>por {current.artist}</p>}
              {current.description && <p>{current.description}</p>}
              {current.book && (
                <p>
                  Del libro <Link href={`/libros/${current.book.slug}`}>«{current.book.title}»</Link>
                </p>
              )}
              {items.length > 1 && (
                <>
                  <div className="galeria-visor-nav">
                    <button type="button" onClick={() => go(-1)}>
                      <span aria-hidden="true">←</span> Anterior
                    </button>
                    <button type="button" onClick={() => go(1)}>
                      Siguiente <span aria-hidden="true">→</span>
                    </button>
                  </div>
                  <p className="galeria-visor-contador" aria-live="polite">
                    {index! + 1} de {items.length}
                    <span className="cat-sr">: {current.title}</span>
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </dialog>
    </>
  )
}
