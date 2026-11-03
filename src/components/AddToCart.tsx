'use client'
import { useState } from 'react'
import { addToCart } from './cart-store'

export function AddToCart(props: { bookId: number; title: string; format: 'digital' | 'fisico'; label: string; disabled?: boolean }) {
  const [added, setAdded] = useState(false)
  return (
    <button
      className="btn"
      disabled={props.disabled}
      onClick={() => {
        addToCart({ bookId: props.bookId, title: props.title, format: props.format, quantity: 1 })
        setAdded(true)
      }}
    >
      {added ? 'Agregado ✓' : props.label}
    </button>
  )
}
