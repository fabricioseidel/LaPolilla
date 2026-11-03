import { NextResponse } from 'next/server'
import { fulfillOrder } from '@/lib/fulfillment'
import { getPayloadClient } from '@/lib/payload'
import { getMercadoPagoPayment, verifyMercadoPagoSignature } from '@/lib/payments/mercadopago'

export async function POST(req: Request) {
  const url = new URL(req.url)
  const body = await req.json().catch(() => ({}))
  const type = body.type ?? url.searchParams.get('type')
  const dataId = String(body.data?.id ?? url.searchParams.get('data.id') ?? '')
  if (type !== 'payment' || !dataId) return NextResponse.json({ ok: true })

  if (!verifyMercadoPagoSignature(req.headers, dataId))
    return NextResponse.json({ error: 'firma inválida' }, { status: 401 })

  // Nunca confiar en el body: consultar el pago directamente a Mercado Pago.
  const payment = await getMercadoPagoPayment(dataId)
  const payload = await getPayloadClient()
  const orderId = Number(payment.external_reference)
  if (!orderId) return NextResponse.json({ ok: true })

  if (payment.status === 'approved') {
    const order = await payload.findByID({ collection: 'orders', id: orderId, overrideAccess: true })
    if (order.total !== payment.transaction_amount || payment.currency_id !== 'CLP') {
      payload.logger.error({ orderId, dataId }, 'Monto de Mercado Pago no coincide con el pedido')
      return NextResponse.json({ error: 'monto' }, { status: 400 })
    }
    await fulfillOrder(payload, orderId, dataId)
  } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
    await payload.update({ collection: 'orders', id: orderId, overrideAccess: true, data: { status: 'cancelado' } })
  }
  return NextResponse.json({ ok: true })
}
