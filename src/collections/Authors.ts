import type { CollectionConfig } from 'payload'
import { publicRead, staffOnly } from '../access/roles'
import { slugField } from './fields/slug'

/** Si se pega "instagram.com/autora" sin https://, se completa para que el enlace funcione. */
const withProtocol = (value?: string | null) =>
  value && !/^(https?:\/\/|mailto:)/i.test(value.trim()) ? `https://${value.trim()}` : value?.trim()

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
      labels: { singular: 'Red', plural: 'Redes' },
      fields: [
        { name: 'label', label: 'Nombre (p. ej. Instagram)', type: 'text', required: true },
        {
          name: 'url',
          label: 'Enlace',
          type: 'text',
          required: true,
          hooks: { beforeValidate: [({ value }) => withProtocol(value)] },
        },
      ],
    },
  ],
}
