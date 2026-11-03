import type { CollectionConfig } from 'payload'
import { isStaff, staffOnly, staffOrOwner } from '../access/roles'

/**
 * Pedido. Se crea "pendiente" en /api/checkout y lo marca "pagado" el webhook
 * de la pasarela. Los precios SIEMPRE se calculan en servidor.
 */
export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Pedido', plural: 'Pedidos' },
  admin: {
    useAsTitle: 'id',
    group: 'Ventas',
    defaultColumns: ['id', 'email', 'status', 'total', 'currency', 'createdAt'],
  },
  access: {
    read: staffOrOwner('user'),
    create: () => false, // sólo vía API interna (overrideAccess)
    update: staffOnly,
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'user', label: 'Cliente', type: 'relationship', relationTo: 'users' },
    { name: 'email', type: 'email', required: true },
    {
      name: 'status',
      label: 'Estado',
      type: 'select',
      required: true,
      defaultValue: 'pendiente',
      options: [
        { label: 'Pendiente de pago', value: 'pendiente' },
        { label: 'Pagado', value: 'pagado' },
        { label: 'Preparando envío', value: 'preparando' },
        { label: 'Enviado', value: 'enviado' },
        { label: 'Entregado', value: 'entregado' },
        { label: 'Cancelado', value: 'cancelado' },
        { label: 'Reembolsado', value: 'reembolsado' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'currency', label: 'Moneda', type: 'select', options: ['CLP', 'USD'], required: true },
        {
          name: 'gateway',
          label: 'Pasarela',
          type: 'select',
          options: [
            { label: 'Mercado Pago', value: 'mercadopago' },
            { label: 'Lemon Squeezy', value: 'lemonsqueezy' },
          ],
          required: true,
        },
        { name: 'gatewayPaymentId', label: 'ID de pago', type: 'text', index: true },
      ],
    },
    {
      name: 'items',
      label: 'Productos',
      type: 'array',
      required: true,
      fields: [
        { name: 'book', type: 'relationship', relationTo: 'books', required: true },
        { name: 'format', type: 'select', options: ['digital', 'fisico'], required: true },
        { name: 'quantity', type: 'number', min: 1, defaultValue: 1 },
        { name: 'unitPrice', type: 'number', required: true },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'subtotal', type: 'number', required: true },
        { name: 'shipping', label: 'Envío', type: 'number', defaultValue: 0 },
        { name: 'total', type: 'number', required: true },
      ],
    },
    {
      name: 'shippingAddress',
      label: 'Dirección de envío',
      type: 'group',
      admin: { condition: (d) => d?.items?.some((i: { format: string }) => i.format === 'fisico') },
      fields: [
        { name: 'name', label: 'Nombre', type: 'text' },
        { name: 'phone', label: 'Teléfono', type: 'text' },
        { name: 'street', label: 'Calle y número', type: 'text' },
        { name: 'comuna', label: 'Comuna', type: 'text' },
        { name: 'region', label: 'Región', type: 'text' },
        { name: 'notes', label: 'Indicaciones', type: 'textarea' },
      ],
    },
    {
      name: 'shipment',
      label: 'Despacho',
      type: 'group',
      fields: [
        { name: 'carrier', label: 'Courier', type: 'select', options: ['Starken', 'Chilexpress', 'Blue Express', 'Retiro'] },
        { name: 'trackingCode', label: 'N° de seguimiento', type: 'text' },
      ],
    },
    {
      name: 'invoice',
      label: 'Boleta electrónica',
      type: 'group',
      admin: { condition: (d) => d?.currency === 'CLP' },
      fields: [
        { name: 'folio', type: 'text' },
        { name: 'url', type: 'text' },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, req, operation }) => {
        // Avisar al cliente cuando la editora marca "enviado" con su código.
        if (operation === 'update' && previousDoc?.status !== 'enviado' && doc.status === 'enviado' && isStaff(req.user as never)) {
          const { sendShippedEmail } = await import('../lib/email')
          await sendShippedEmail(req.payload, doc)
        }
      },
    ],
  },
}
