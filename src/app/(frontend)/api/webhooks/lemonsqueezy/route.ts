import { NextResponse } from 'next/server'
import { fulfillOrder } from '@/lib/fulfillment'
import { getPayloadClient } from '@/lib/payload'
import { verifyLemonSignature } from '@/lib/payments/lemonsqueezy'

export async function POST(req: Request) {
  const raw = await req.text()
  if (!verifyLemonSignature(raw, req.headers.get('x-signature')))
    return NextResponse.json({ error: 'firma inválida' }, { status: 401 })

  const event = JSON.parse(raw)
  const orderId = Number(event.meta?.custom_data?.order_id)
  const payload = await getPayloadClient()
  if (!orderId) return NextResponse.json({ ok: true })

  switch (event.meta?.event_name) {
    case 'order_created':
      if (event.data?.attributes?.status === 'paid') await fulfillOrder(payload, orderId, String(event.data.id))
      break
    case 'order_refunded':
      await payload.update({ collection: 'orders', id: orderId, overrideAccess: true, data: { status: 'reembolsado' } })
      break
  }
  return NextResponse.json({ ok: true })
}
