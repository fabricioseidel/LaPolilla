import { headers as getHeaders } from 'next/headers'
import { NextResponse } from 'next/server'
import { CartError, priceCart, type CartItem, type Market } from '@/lib/cart'
import { getPayloadClient } from '@/lib/payload'
import { gateways } from '@/lib/payments/config'
import { createLemonCheckout } from '@/lib/payments/lemonsqueezy'
import { createMercadoPagoCheckout } from '@/lib/payments/mercadopago'

type Body = {
  items: CartItem[]
  market: Market
  shippingAddress?: { name: string; phone: string; street: string; comuna: string; region: string; notes?: string }
}

export async function POST(req: Request) {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await getHeaders() })
  // Se compra con cuenta: así el libro queda siempre en "Mi biblioteca".
  if (!user) return NextResponse.json({ error: 'Ingresa o crea tu cuenta para comprar' }, { status: 401 })

  const body = (await req.json()) as Body
  const enabled = gateways()
  if (body.market === 'CL' && !enabled.mercadopago)
    return NextResponse.json({ error: 'Los pagos en Chile aún no están habilitados' }, { status: 503 })
  if (body.market === 'INTL' && !enabled.lemonsqueezy)
    return NextResponse.json({ error: 'Los pagos internacionales aún no están habilitados' }, { status: 503 })

  try {
    const cart = await priceCart(payload, body.items, body.market, body.shippingAddress?.region)
    if (cart.hasPhysical && !body.shippingAddress?.street)
      return NextResponse.json({ error: 'Falta la dirección de envío' }, { status: 400 })

    const order = await payload.create({
      collection: 'orders',
      overrideAccess: true,
      data: {
        user: user.id,
        email: user.email,
        status: 'pendiente',
        currency: cart.currency,
        gateway: body.market === 'CL' ? 'mercadopago' : 'lemonsqueezy',
        items: cart.lines.map((l) => ({ book: l.book.id, format: l.format, quantity: l.quantity, unitPrice: l.unitPrice })),
        subtotal: cart.subtotal,
        shipping: cart.shipping,
        total: cart.total,
        shippingAddress: cart.hasPhysical ? body.shippingAddress : undefined,
      },
    })

    const titles = Object.fromEntries(cart.lines.map((l) => [l.book.id, l.book.title]))
    const url =
      body.market === 'CL'
        ? await createMercadoPagoCheckout(order, titles)
        : await createLemonCheckout(order, cart.lines.map((l) => l.book.title).join(', '))

    return NextResponse.json({ url, orderId: order.id })
  } catch (e) {
    if (e instanceof CartError) return NextResponse.json({ error: e.message }, { status: 400 })
    payload.logger.error(e)
    return NextResponse.json({ error: 'No se pudo iniciar el pago. Intenta de nuevo en unos minutos.' }, { status: 500 })
  }
}
