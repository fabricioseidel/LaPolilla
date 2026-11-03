import type { Payload } from 'payload'
import type { Book } from '@/payload-types'

export type CartItem = { bookId: number; format: 'digital' | 'fisico'; quantity: number }
export type Market = 'CL' | 'INTL'

export class CartError extends Error {}

/**
 * Valida el carrito y calcula precios en servidor (nunca confiar en el cliente).
 * - CL: Mercado Pago en CLP, digital y físico.
 * - INTL: Lemon Squeezy en USD, sólo digital.
 */
export async function priceCart(payload: Payload, items: CartItem[], market: Market, region?: string) {
  if (!items.length) throw new CartError('El carrito está vacío')
  const currency = market === 'CL' ? 'CLP' : 'USD'
  const lines: { book: Book; format: CartItem['format']; quantity: number; unitPrice: number }[] = []

  for (const item of items) {
    const book = await payload.findByID({ collection: 'books', id: item.bookId, depth: 0 })
    if (!book || book.status === 'borrador') throw new CartError('Libro no disponible')
    const quantity = item.format === 'digital' ? 1 : Math.max(1, Math.min(10, item.quantity | 0))

    let unitPrice: number | null | undefined
    if (item.format === 'digital') {
      if (!book.digitalEnabled) throw new CartError(`"${book.title}" no está disponible en digital`)
      unitPrice = market === 'CL' ? book.priceDigitalCLP : book.priceDigitalUSD
    } else {
      if (market !== 'CL') throw new CartError('Los libros físicos sólo se envían dentro de Chile')
      if (!book.physicalEnabled) throw new CartError(`"${book.title}" no está disponible en físico`)
      if (book.fulfillment === 'stock' && (book.stock ?? 0) < quantity)
        throw new CartError(`Quedan ${book.stock ?? 0} ejemplares de "${book.title}"`)
      unitPrice = book.pricePhysicalCLP
    }
    if (unitPrice == null) throw new CartError(`"${book.title}" no tiene precio en ${currency}`)
    lines.push({ book, format: item.format, quantity, unitPrice })
  }

  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0)
  const hasPhysical = lines.some((l) => l.format === 'fisico')
  let shipping = 0
  if (hasPhysical) {
    const settings = await payload.findGlobal({ slug: 'site-settings' })
    const rate = settings.shippingRates?.find((r) => r.region === region)
    if (!rate) throw new CartError('Selecciona una región de envío válida')
    shipping = rate.price
  }
  return { currency, lines, subtotal, shipping, total: subtotal + shipping, hasPhysical } as const
}
