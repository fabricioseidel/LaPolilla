import crypto from 'crypto'
import type { Order } from '@/payload-types'

const API = 'https://api.lemonsqueezy.com/v1'

/**
 * Lemon Squeezy actúa como "merchant of record": cobra y declara el IVA/VAT
 * de cada país. Se usa UNA variante genérica ("Libros digitales La Polilla")
 * con precio personalizado por checkout, así la editora no tiene que crear
 * nada en Lemon Squeezy por cada libro nuevo.
 */
export async function createLemonCheckout(order: Order, description: string) {
  const res = await fetch(`${API}/checkouts`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
    },
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          custom_price: Math.round(order.total * 100), // centavos USD
          checkout_data: { email: order.email, custom: { order_id: String(order.id) } },
          product_options: {
            name: 'Editorial La Polilla',
            description,
            redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/gracias?pedido=${order.id}`,
          },
        },
        relationships: {
          store: { data: { type: 'stores', id: process.env.LEMONSQUEEZY_STORE_ID } },
          variant: { data: { type: 'variants', id: process.env.LEMONSQUEEZY_VARIANT_ID } },
        },
      },
    }),
  })
  if (!res.ok) throw new Error(`Lemon Squeezy: ${res.status} ${await res.text()}`)
  const json = await res.json()
  return json.data.attributes.url as string
}

export function verifyLemonSignature(rawBody: string, signature: string | null) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
  if (!secret || !signature) return false
  const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  return digest.length === signature.length && crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
}
