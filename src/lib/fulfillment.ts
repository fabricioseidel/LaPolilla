import type { Payload } from 'payload'
import { sendOrderPaidEmail } from './email'
import { issueBoleta } from './invoicing'

const relId = (v: number | { id: number }) => (typeof v === 'object' ? v.id : v)

/**
 * Se llama desde los webhooks cuando el pago está aprobado. Es idempotente:
 * si el pedido ya no está "pendiente", no hace nada.
 * 1) marca pagado  2) da acceso a ebook + audiolibro  3) descuenta stock
 * 4) emite boleta (CLP)  5) envía email
 */
export async function fulfillOrder(payload: Payload, orderId: number, gatewayPaymentId: string) {
  const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 0, overrideAccess: true })
  if (!order || order.status !== 'pendiente') return

  const hasPhysical = order.items.some((i) => i.format === 'fisico')
  await payload.update({
    collection: 'orders',
    id: orderId,
    overrideAccess: true,
    data: { status: hasPhysical ? 'preparando' : 'pagado', gatewayPaymentId },
  })

  // Crear cuenta de cliente si compró como invitado
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
        })
      ).id
    await payload.update({ collection: 'orders', id: orderId, overrideAccess: true, data: { user: userId } })
    // El cliente define su contraseña con "olvidé mi contraseña" (link en el email).
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
    } catch (e) {
      payload.logger.error({ err: e, orderId }, 'No se pudo emitir la boleta; emitir manualmente')
    }
  }
  await sendOrderPaidEmail(payload, fresh)
}
