import { NextResponse } from 'next/server'
import { fulfillOrder } from '@/lib/fulfillment'
import { getPayloadClient } from '@/lib/payload'
import { checkMercadoPagoSignature, getMercadoPagoPayment } from '@/lib/payments/mercadopago'

export async function POST(req: Request) {
  const url = new URL(req.url)
  const body = await req.json().catch(() => ({}))
  const type = body.type ?? url.searchParams.get('type')
  const dataId = String(url.searchParams.get('data.id') ?? body.data?.id ?? '')
  if (type !== 'payment' || !dataId) return NextResponse.json({ ok: true })

  if (checkMercadoPagoSignature(req.headers, dataId) === 'invalid')
    return NextResponse.json({ error: 'firma inválida' }, { status: 401 })

  const payload = await getPayloadClient()

  // La fuente de verdad es la API de Mercado Pago, nunca el contenido de la notificación.
  let payment: Awaited<ReturnType<typeof getMercadoPagoPayment>>
  try {
    payment = await getMercadoPagoPayment(dataId)
  } catch (err) {
    payload.logger.error({ err, dataId }, 'No se pudo consultar el pago en Mercado Pago')
    return NextResponse.json({ error: 'reintentar' }, { status: 500 }) // Mercado Pago reintenta
  }

  const orderId = Number(payment.external_reference)
  if (!orderId) return NextResponse.json({ ok: true })
  const order = await payload.findByID({ collection: 'orders', id: orderId, overrideAccess: true, depth: 0 }).catch(() => null)
  if (!order) return NextResponse.json({ ok: true })

  switch (payment.status) {
    case 'approved':
      if (order.total !== payment.transaction_amount || payment.currency_id !== 'CLP') {
        payload.logger.error({ orderId, dataId }, 'El monto pagado en Mercado Pago no coincide con el pedido')
        return NextResponse.json({ ok: true })
      }
      await fulfillOrder(payload, orderId, dataId)
      break
    case 'refunded':
    case 'charged_back':
      if (order.status !== 'pendiente')
        await payload.update({ collection: 'orders', id: orderId, overrideAccess: true, data: { status: 'reembolsado' } })
      break
    // pending / in_process / rejected / cancelled: el pedido sigue pendiente;
    // el comprador puede reintentar el pago con otra tarjeta.
  }
  return NextResponse.json({ ok: true })
}
