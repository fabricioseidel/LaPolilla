'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Gateways } from '@/lib/payments/config'
import { readCart, writeCart, type StoredItem } from './cart-store'

type Props = { userEmail: string | null; gateways: Gateways; regions: { region: string; price: number }[] }

export function CartView({ userEmail, gateways, regions }: Props) {
  const [items, setItems] = useState<StoredItem[]>([])
  const [market, setMarket] = useState<'CL' | 'INTL'>(gateways.mercadopago || !gateways.lemonsqueezy ? 'CL' : 'INTL')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  useEffect(() => setItems(readCart()), [])

  const hasPhysical = items.some((i) => i.format === 'fisico')
  const anyGateway = gateways.mercadopago || gateways.lemonsqueezy
  const update = (next: StoredItem[]) => {
    setItems(next)
    writeCart(next)
  }

  async function pay(form: FormData) {
    setError('')
    setLoading(true)
    const res = await fetch('/api/checkout', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        market,
        items: items.map(({ bookId, format, quantity }) => ({ bookId, format, quantity })),
        shippingAddress: hasPhysical
          ? Object.fromEntries(['name', 'phone', 'street', 'comuna', 'region', 'notes'].map((k) => [k, form.get(k)]))
          : undefined,
      }),
    })
    const json = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) return setError(json.error ?? 'No se pudo iniciar el pago')
    window.location.href = json.url
  }

  if (!items.length) return <p>Tu carrito está vacío. <Link href="/libros">Ver libros</Link></p>

  return (
    <form action={pay} className="cart">
      <ul>
        {items.map((i, idx) => (
          <li key={`${i.bookId}-${i.format}`}>
            <span>
              {i.title} · {i.format === 'digital' ? 'Digital (ebook + audiolibro)' : `Físico ×${i.quantity} (incluye ebook + audiolibro)`}
            </span>
            <button type="button" className="link" onClick={() => update(items.filter((_, j) => j !== idx))}>
              Quitar
            </button>
          </li>
        ))}
      </ul>

      {!anyGateway ? (
        <p>Las compras estarán disponibles muy pronto.</p>
      ) : !userEmail ? (
        <div className="notice">
          <p>Para comprar necesitas una cuenta: así tus libros y audiolibros quedan guardados en <b>Mi biblioteca</b>.</p>
          <p>
            <Link className="btn" href="/cuenta/registro?volver=/carrito">Crear cuenta</Link>{' '}
            <Link className="btn secondary" href="/cuenta/ingresar?volver=/carrito">Ya tengo cuenta</Link>
          </p>
        </div>
      ) : (
        <>
          <fieldset>
            <legend>¿Desde dónde compras?</legend>
            {gateways.mercadopago && (
              <label className="radio">
                <input type="radio" name="market" checked={market === 'CL'} onChange={() => setMarket('CL')} /> Chile (pesos chilenos · Mercado Pago)
              </label>
            )}
            {gateways.lemonsqueezy && (
              <label className="radio">
                <input type="radio" name="market" checked={market === 'INTL'} onChange={() => setMarket('INTL')} disabled={hasPhysical} /> Otro
                país (dólares · tarjeta o PayPal)
              </label>
            )}
            {hasPhysical && <small>Los libros físicos se envían sólo dentro de Chile.</small>}
          </fieldset>

          {hasPhysical && market === 'CL' && (
            <fieldset>
              <legend>Envío</legend>
              <label>Nombre <input name="name" autoComplete="name" required /></label>
              <label>Teléfono <input name="phone" type="tel" autoComplete="tel" required /></label>
              <label>Calle y número <input name="street" autoComplete="street-address" required /></label>
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

          <small>Comprando como {userEmail}. El total final (con envío) se muestra en la pasarela de pago.</small>
          <label className="radio terms">
            <input type="checkbox" name="terminos" required />
            <span>
              Acepto los <Link href="/terminos">términos y condiciones</Link>. Entiendo que el contenido digital (ebook y
              audiolibro) queda disponible de inmediato y que, una vez descargado o escuchado, no aplica el{' '}
              <Link href="/terminos#derecho-a-retracto">derecho a retracto</Link>.
            </span>
          </label>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn" disabled={loading || (hasPhysical && market !== 'CL')}>
            {loading ? 'Redirigiendo…' : 'Ir a pagar'}
          </button>
        </>
      )}
    </form>
  )
}
