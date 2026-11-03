import crypto from 'crypto'
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago'
import type { Order } from '@/payload-types'

const client = () => new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })
const site = () => process.env.NEXT_PUBLIC_SITE_URL!

export async function createMercadoPagoCheckout(order: Order, titles: Record<number, string>) {
  const items = order.items.map((i) => ({
    id: `${typeof i.book === 'object' ? i.book.id : i.book}-${i.format}`,
    title: `${titles[typeof i.book === 'object' ? i.book.id : i.book]} (${i.format})`,
    quantity: i.quantity ?? 1,
    unit_price: i.unitPrice,
    currency_id: 'CLP',
  }))
  if (order.shipping) items.push({ id: 'envio', title: 'Envío', quantity: 1, unit_price: order.shipping, currency_id: 'CLP' })

  const pref = await new Preference(client()).create({
    body: {
      items,
      payer: { email: order.email },
      external_reference: String(order.id),
      notification_url: `${site()}/api/webhooks/mercadopago`,
      back_urls: {
        success: `${site()}/checkout/gracias?pedido=${order.id}`,
        pending: `${site()}/checkout/gracias?pedido=${order.id}`,
        failure: `${site()}/carrito?error=pago`,
      },
      auto_return: 'approved',
    },
  })
  return pref.init_point!
}

/** Valida la firma x-signature de Mercado Pago. */
export function verifyMercadoPagoSignature(headers: Headers, dataId: string) {
  const secret = process.env.MP_WEBHOOK_SECRET
  const sig = headers.get('x-signature')
  const requestId = headers.get('x-request-id')
  if (!secret || !sig) return false
  const parts = Object.fromEntries(sig.split(',').map((p) => p.trim().split('=') as [string, string]))
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`
  const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex')
  return parts.v1 && crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(parts.v1))
}

export async function getMercadoPagoPayment(id: string) {
  return new Payment(client()).get({ id })
}
