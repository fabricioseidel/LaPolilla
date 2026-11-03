'use client'
import { useEffect, useState } from 'react'
import { readCart } from './cart-store'

export function CartCount() {
  const [n, setN] = useState(0)
  useEffect(() => {
    const update = () => setN(readCart().reduce((s, i) => s + i.quantity, 0))
    update()
    window.addEventListener('cart', update)
    return () => window.removeEventListener('cart', update)
  }, [])
  return n ? <span className="badge">{n}</span> : null
}
