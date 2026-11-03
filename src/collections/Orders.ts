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
    description:
      'Los pedidos se crean solos cuando alguien compra. Los que tienen libros físicos quedan en «Preparando envío» hasta que los despachas.',
    defaultColumns: ['id', 'createdAt', 'email', 'status', 'total', 'currency'],
    listSearchableFields: ['id', 'email'],
    components: {
      // Exportación de ventas (CSV) sobre la tabla: sólo administradora y jefa de edición.
      beforeListTable: ['/components/admin/gestion/ExportarVentas'],
    },
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
      admin: {
        description:
          '«Preparando envío»: tiene libros físicos por despachar. Al cambiarlo a «Enviado» (con courier y n° de seguimiento) el cliente recibe un email.',
      },
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
      labels: { singular: 'Producto', plural: 'Productos' },
      type: 'array',
      required: true,
      fields: [
        { name: 'book', label: 'Libro', type: 'relationship', relationTo: 'books', required: true },
        {
          name: 'format',
          label: 'Formato',
          type: 'select',
          options: [
            { label: 'Digital', value: 'digital' },
            { label: 'Físico', value: 'fisico' },
          ],
          required: true,
        },
        { name: 'quantity', label: 'Cantidad', type: 'number', min: 1, defaultValue: 1 },
        { name: 'unitPrice', label: 'Precio unitario', type: 'number', required: true },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'subtotal', label: 'Subtotal', type: 'number', required: true },
        { name: 'shipping', label: 'Envío', type: 'number', defaultValue: 0 },
        {
          name: 'total',
          label: 'Total',
          type: 'number',
          required: true,
          admin: { components: { Cell: '/components/admin/gestion/CeldaTotal' } },
        },
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
      // Botón "Imprimir etiqueta de despacho" (no guarda datos).
      name: 'etiquetaDespacho',
      type: 'ui',
      admin: {
        condition: (d) => d?.items?.some((i: { format: string }) => i.format === 'fisico'),
        disableListColumn: true,
        components: { Field: '/components/admin/gestion/EtiquetaDespacho' },
      },
    },
    {
      name: 'shipment',
      label: 'Despacho',
      type: 'group',
      admin: { description: 'Al marcar Enviado con el n° de seguimiento, el cliente recibe un email.' },
      fields: [
        {
          name: 'carrier',
          label: 'Courier',
          type: 'select',
          options: ['Starken', 'Chilexpress', 'Blue Express', 'Retiro'],
          admin: { description: 'Elige «Retiro» si el cliente lo retira en persona.' },
        },
        {
          name: 'trackingCode',
          label: 'N° de seguimiento',
          type: 'text',
          admin: { description: 'Está en el comprobante del courier. Se incluye en el email al cliente.' },
        },
      ],
    },
    {
      name: 'invoice',
      label: 'Boleta electrónica',
      type: 'group',
      admin: {
        condition: (d) => d?.currency === 'CLP',
        description: 'Mientras no haya boleta automática, emítela en el portal del SII y anota aquí su folio.',
      },
      fields: [
        { name: 'folio', label: 'Folio', type: 'text' },
        { name: 'url', label: 'Enlace a la boleta (opcional)', type: 'text' },
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
