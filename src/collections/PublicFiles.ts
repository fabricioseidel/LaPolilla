import type { CollectionConfig } from 'payload'
import { publicRead, staffOnly } from '../access/roles'

/** PDFs públicos: muestras gratuitas, dossiers de prensa. */
export const PublicFiles: CollectionConfig = {
  slug: 'media-public-files',
  labels: { singular: 'Archivo público', plural: 'Archivos públicos' },
  admin: { group: 'Archivos' },
  access: { read: publicRead, create: staffOnly, update: staffOnly, delete: staffOnly },
  fields: [{ name: 'description', label: 'Descripción', type: 'text' }],
  upload: { mimeTypes: ['application/pdf'] },
}
