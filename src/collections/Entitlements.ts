import type { CollectionConfig } from 'payload'
import { adminOnly, staffOrOwner } from '../access/roles'

/** "Mi biblioteca": qué libros puede leer/escuchar cada usuario. */
export const Entitlements: CollectionConfig = {
  slug: 'entitlements',
  labels: { singular: 'Acceso a libro', plural: 'Biblioteca de clientes' },
  admin: { group: 'Ventas', defaultColumns: ['user', 'book', 'order', 'createdAt'] },
  access: { read: staffOrOwner('user'), create: adminOnly, update: adminOnly, delete: adminOnly },
  indexes: [{ fields: ['user', 'book'], unique: true }],
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'book', type: 'relationship', relationTo: 'books', required: true },
    { name: 'order', type: 'relationship', relationTo: 'orders' },
    {
      name: 'audioProgress',
      type: 'json',
      admin: { description: 'Avance del audiolibro { capitulo, segundo }' },
    },
  ],
}
