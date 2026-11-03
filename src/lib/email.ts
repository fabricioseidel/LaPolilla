import type { Payload } from 'payload'
import type { Order } from '@/payload-types'

const site = () => process.env.NEXT_PUBLIC_SITE_URL

export async function sendOrderPaidEmail(payload: Payload, order: Order) {
  const physical = order.items.some((i) => i.format === 'fisico')
  await payload.sendEmail({
    to: order.email,
    subject: `Tu compra en Editorial La Polilla (pedido #${order.id})`,
    html: `
      <p>¡Gracias por tu compra!</p>
      <p>Tu ebook y audiolibro ya están en <a href="${site()}/biblioteca">Mi biblioteca</a>.</p>
      ${physical ? '<p>Tu libro físico está en preparación. Te avisaremos cuando sea despachado.</p>' : ''}
      ${order.invoice?.url ? `<p><a href="${order.invoice.url}">Descargar boleta</a></p>` : ''}
    `,
  })
}

export async function sendShippedEmail(payload: Payload, order: Order) {
  await payload.sendEmail({
    to: order.email,
    subject: `Tu libro va en camino (pedido #${order.id})`,
    html: `<p>Tu pedido fue despachado por ${order.shipment?.carrier ?? 'courier'}.</p>
           <p>N° de seguimiento: <b>${order.shipment?.trackingCode ?? '-'}</b></p>`,
  })
}
