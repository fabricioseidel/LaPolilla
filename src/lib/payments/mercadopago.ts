import crypto from 'crypto'
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago'
import type { Order } from '@/payload-types'
import { isMercadoPagoTest } from './config'

const client = () => new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })
const site = () => process.env.NEXT_PUBLIC_SITE_URL!

export async function createMercadoPagoCheckout(order: Order, titles: Record<number, string>) {
  const bookId = (b: Order['items'][number]['book']) => (typeof b === 'object' ? b.id : b)
  const items = order.items.map((i) => ({
    id: `${bookId(i.book)}-${i.format}`,
    title: `${titles[bookId(i.book)]} (${i.format === 'digital' ? 'digital' : 'físico'})`,
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
      statement_descriptor: 'LA POLILLA',
      back_urls: {
        success: `${site()}/checkout/gracias?pedido=${order.id}`,
        pending: `${site()}/checkout/gracias?pedido=${order.id}`,
        failure: `${site()}/carrito?error=pago`,
      },
      auto_return: 'approved',
    },
  })
  // Con credenciales de prueba se usa el checkout de pruebas (sandbox).
  return (isMercadoPagoTest() && pref.sandbox_init_point) || pref.init_point!
}

/**
 * Valida la firma `x-signature` de Mercado Pago.
 * - 'ok': firma válida · 'invalid': firma presente pero incorrecta
 * - 'unsigned': sin clave configurada o sin firma en la notificación
 */
export function checkMercadoPagoSignature(headers: Headers, dataId: string): 'ok' | 'invalid' | 'unsigned' {
  const secret = process.env.MP_WEBHOOK_SECRET
  const sig = headers.get('x-signature')
  if (!secret || !sig) return 'unsigned'
  const parts = Object.fromEntries(
    sig.split(',').map((p) => {
      const [k, ...v] = p.trim().split('=')
      return [k, v.join('=')]
    }),
  )
  if (!parts.ts || !parts.v1) return 'invalid'
  const requestId = headers.get('x-request-id')
  // Plantilla oficial: se omiten las partes que no vienen en la notificación.
  const manifest =
    (dataId ? `id:${dataId.toLowerCase()};` : '') + (requestId ? `request-id:${requestId};` : '') + `ts:${parts.ts};`
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex')
  if (expected.length !== parts.v1.length) return 'invalid'
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1)) ? 'ok' : 'invalid'
}

export async function getMercadoPagoPayment(id: string) {
  return new Payment(client()).get({ id })
}
