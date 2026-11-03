'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import '@/app/(frontend)/styles/catalogo.css'
import { addToCart, readCart } from './cart-store'

type Props = {
  bookId: number
  title: string
  format: 'digital' | 'fisico'
  /** Texto del botón. Por defecto "Agregar al carrito". */
  label?: string
  disabled?: boolean
  /** Máximo de ejemplares que se pueden agregar (stock disponible). */
  max?: number
}

const BagIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 7h12l-1 13H7L6 7Z" />
    <path d="M9 7a3 3 0 0 1 6 0" />
  </svg>
)

/** Botón "Agregar al carrito" con confirmación visible (y anunciada) y enlace a "Ver carrito". */
export function AddToCart({ bookId, title, format, label, disabled, max }: Props) {
  const [inCart, setInCart] = useState(0)
  const [justAdded, setJustAdded] = useState(false)

  useEffect(() => {
    const sync = () => setInCart(readCart().find((i) => i.bookId === bookId && i.format === format)?.quantity ?? 0)
    sync()
    window.addEventListener('cart', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('cart', sync)
      window.removeEventListener('storage', sync)
    }
  }, [bookId, format])

  const digital = format === 'digital'
  const full = !digital && max != null && inCart >= max
  let text = label ?? 'Agregar al carrito'
  if (!disabled && inCart > 0) text = digital ? 'En tu carrito' : full ? 'No quedan más ejemplares' : 'Agregar otro ejemplar'

  let status = ''
  if (inCart > 0)
    status = digital
      ? justAdded
        ? 'Agregado al carrito.'
        : 'Ya está en tu carrito.'
      : `${justAdded ? 'Agregado. ' : ''}Tienes ${inCart} ${inCart === 1 ? 'ejemplar' : 'ejemplares'} en tu carrito.`

  return (
    <div className="carrito-accion">
      <button
        type="button"
        className="btn"
        disabled={disabled || full}
        onClick={() => {
          if (!(digital && inCart > 0)) addToCart({ bookId, title, format, quantity: 1 })
          setJustAdded(true)
        }}
      >
        {!disabled && <BagIcon />}
        {text}
      </button>
      <p className="carrito-estado" role="status">
        {status && (
          <>
            {status} <Link href="/carrito">Ver carrito</Link>
          </>
        )}
      </p>
    </div>
  )
}
