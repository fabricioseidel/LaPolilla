import type { CollectionConfig } from 'payload'
import { publicRead, staffOnly } from '../access/roles'

export const Illustrations: CollectionConfig = {
  slug: 'illustrations',
  labels: { singular: 'Ilustración', plural: 'Ilustraciones' },
  admin: { useAsTitle: 'title', group: 'Contenido' },
  access: { read: publicRead, create: staffOnly, update: staffOnly, delete: staffOnly },
  fields: [
    { name: 'title', label: 'Título', type: 'text', required: true },
    { name: 'image', label: 'Imagen', type: 'upload', relationTo: 'media', required: true },
    { name: 'artist', label: 'Ilustrador/a', type: 'text' },
    { name: 'book', label: 'Libro relacionado', type: 'relationship', relationTo: 'books' },
    { name: 'description', label: 'Descripción', type: 'textarea' },
  ],
}
