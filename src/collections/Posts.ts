import type { CollectionConfig } from 'payload'
import { staffOnly } from '../access/roles'
import { slugField } from './fields/slug'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Noticia', plural: 'Noticias / Blog' },
  admin: { useAsTitle: 'title', group: 'Contenido' },
  versions: { drafts: true },
  access: {
    read: ({ req }) => (req.user && req.user.role !== 'cliente' ? true : { _status: { equals: 'published' } }),
    create: staffOnly,
    update: staffOnly,
    delete: staffOnly,
  },
  fields: [
    { name: 'title', label: 'Título', type: 'text', required: true },
    slugField('title'),
    { name: 'cover', label: 'Imagen', type: 'upload', relationTo: 'media' },
    { name: 'excerpt', label: 'Resumen', type: 'textarea' },
    { name: 'content', label: 'Contenido', type: 'richText' },
    { name: 'publishedAt', label: 'Fecha', type: 'date', admin: { position: 'sidebar' } },
  ],
}
