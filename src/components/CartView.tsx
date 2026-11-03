'use client'
import { useEffect, useState } from 'react'
import { readCart, writeCart, type StoredItem } from './cart-store'

export function CartView({ regions }: { regions: { region: string; price: number }[] }) {
  const [items, setItems] = useState<StoredItem[]>([])
  const [market, setMarket] = useState<'CL' | 'INTL'>('CL')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  useEffect(() => setItems(readCart()), [])

  const hasPhysical = items.some((i) => i.format === 'fisico')
  const update = (next: StoredItem[]) => {
    setItems(next)
    writeCart(next)
  }

  async function pay(form: FormData) {
    setError('')
    setLoading(true)
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        market,
        email: form.get('email'),
        items: items.map(({ bookId, format, quantity }) => ({ bookId, format, quantity })),
        shippingAddress: hasPhysical
          ? Object.fromEntries(['name', 'phone', 'street', 'comuna', 'region', 'notes'].map((k) => [k, form.get(k)]))
          : undefined,
      }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) return setError(json.error)
    window.location.href = json.url
  }

  if (!items.length) return <p>Tu carrito está vacío.</p>

  return (
    <form action={pay} className="cart">
      <ul>
        {items.map((i, idx) => (
          <li key={`${i.bookId}-${i.format}`}>
            {i.title} · {i.format === 'digital' ? 'Digital (ebook + audiolibro)' : `Físico ×${i.quantity} (incluye ebook + audiolibro)`}
            <button type="button" className="link" onClick={() => update(items.filter((_, j) => j !== idx))}>
              Quitar
            </button>
          </li>
        ))}
      </ul>

      <fieldset>
        <legend>¿Desde dónde compras?</legend>
        <label><input type="radio" checked={market === 'CL'} onChange={() => setMarket('CL')} /> Chile (CLP · Mercado Pago)</label>
        <label>
          <input type="radio" checked={market === 'INTL'} onChange={() => setMarket('INTL')} disabled={hasPhysical} /> Otro país (USD · tarjeta/PayPal)
        </label>
        {hasPhysical && <small>Los libros físicos sólo se envían dentro de Chile.</small>}
      </fieldset>

      <label>Email <input name="email" type="email" required /></label>

      {hasPhysical && (
        <fieldset>
          <legend>Envío</legend>
          <label>Nombre <input name="name" required /></label>
          <label>Teléfono <input name="phone" required /></label>
          <label>Calle y número <input name="street" required /></label>
          <label>Comuna <input name="comuna" required /></label>
          <label>
            Región
            <select name="region" required>
              {regions.map((r) => (
                <option key={r.region} value={r.region}>{r.region}</option>
              ))}
            </select>
          </label>
          <label>Indicaciones <textarea name="notes" /></label>
        </fieldset>
      )}

      {error && <p className="error">{error}</p>}
      <button className="btn" disabled={loading}>{loading ? 'Redirigiendo…' : 'Pagar'}</button>
      <small>El total final (con envío) se muestra en la pasarela de pago.</small>
    </form>
  )
}
