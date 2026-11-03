import { sql, type PostgresAdapter } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'
import { sendOrderPaidEmail } from './email'
import { issueBoleta } from './invoicing'

const relId = (v: number | { id: number }) => (typeof v === 'object' ? v.id : v)

/**
 * Se llama desde los webhooks cuando el pago está aprobado.
 * Las pasarelas suelen mandar varias notificaciones del mismo pago al mismo tiempo,
 * así que el pedido se "reclama" con un UPDATE atómico: sólo la primera notificación
 * lo procesa (acceso a la biblioteca, stock, boleta y email una sola vez).
 */
export async function fulfillOrder(payload: Payload, orderId: number, gatewayPaymentId: string) {
  const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 0, overrideAccess: true })
  if (!order || order.status !== 'pendiente') return

  const newStatus = order.items.some((i) => i.format === 'fisico') ? 'preparando' : 'pagado'
  const db = payload.db as unknown as PostgresAdapter
  const claimed = await db.drizzle.execute(
    sql`update "payload"."orders" set "status" = ${newStatus}, "gateway_payment_id" = ${gatewayPaymentId}, "updated_at" = now()
        where "id" = ${orderId} and "status" = 'pendiente' returning "id"`,
  )
  if (!claimed.rows.length) return // otra notificación ya lo procesó

  // Compatibilidad: pedidos antiguos sin cuenta asociada.
  let userId = order.user ? relId(order.user) : undefined
  if (!userId) {
    const existing = await payload.find({ collection: 'users', where: { email: { equals: order.email } }, limit: 1, overrideAccess: true })
    userId =
      existing.docs[0]?.id ??
      (
        await payload.create({
          collection: 'users',
          overrideAccess: true,
          data: { email: order.email, password: crypto.randomUUID(), role: 'cliente' },
          context: { skipWelcome: true },
        })
      ).id
    await payload.update({ collection: 'orders', id: orderId, overrideAccess: true, data: { user: userId } })
  }

  for (const item of order.items) {
    const bookId = relId(item.book)
    const owned = await payload.find({
      collection: 'entitlements',
      where: { and: [{ user: { equals: userId } }, { book: { equals: bookId } }] },
      limit: 1,
      overrideAccess: true,
    })
    if (!owned.docs.length)
      await payload.create({ collection: 'entitlements', overrideAccess: true, data: { user: userId, book: bookId, order: orderId } })

    if (item.format === 'fisico') {
      const book = await payload.findByID({ collection: 'books', id: bookId, depth: 0, overrideAccess: true })
      if (book.fulfillment === 'stock')
        await payload.update({
          collection: 'books',
          id: bookId,
          overrideAccess: true,
          data: { stock: Math.max(0, (book.stock ?? 0) - (item.quantity ?? 1)) },
        })
    }
  }

  const fresh = await payload.findByID({ collection: 'orders', id: orderId, depth: 1, overrideAccess: true })
  if (fresh.currency === 'CLP') {
    try {
      const boleta = await issueBoleta(fresh)
      if (boleta) await payload.update({ collection: 'orders', id: orderId, overrideAccess: true, data: { invoice: boleta } })
    } catch (err) {
      payload.logger.error({ err, orderId }, 'No se pudo emitir la boleta; emitir manualmente')
    }
  }
  try {
    await sendOrderPaidEmail(payload, fresh)
  } catch (err) {
    payload.logger.error({ err, orderId }, 'No se pudo enviar el email de confirmación')
  }
}
