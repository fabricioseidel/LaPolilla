import type { CollectionConfig } from 'payload'
import { publicRead, staffOnly } from '../access/roles'

/** Imágenes públicas: portadas, fotos de autoras, ilustraciones. */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Imagen', plural: 'Imágenes' },
  admin: { group: 'Archivos' },
  access: { read: publicRead, create: staffOnly, update: staffOnly, delete: staffOnly },
  fields: [{ name: 'alt', label: 'Texto alternativo', type: 'text', required: true }],
  upload: {
    mimeTypes: ['image/*'],
    imageSizes: [
      { name: 'thumb', width: 300 },
      { name: 'card', width: 600 },
      { name: 'hero', width: 1600 },
    ],
  },
}
