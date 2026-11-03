import type { CollectionConfig } from 'payload'
import { publicRead, staffOnly } from '../access/roles'
import { slugField } from './fields/slug'

export const Authors: CollectionConfig = {
  slug: 'authors',
  labels: { singular: 'Autora/Autor', plural: 'Autoras y autores' },
  admin: { useAsTitle: 'name', group: 'Catálogo' },
  access: { read: publicRead, create: staffOnly, update: staffOnly, delete: staffOnly },
  fields: [
    { name: 'name', label: 'Nombre', type: 'text', required: true },
    slugField('name'),
    { name: 'photo', label: 'Foto', type: 'upload', relationTo: 'media' },
    { name: 'bio', label: 'Biografía', type: 'richText' },
    {
      name: 'links',
      label: 'Redes',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
      ],
    },
  ],
}
