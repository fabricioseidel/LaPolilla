import type { CollectionConfig } from 'payload'
import { staffOnly } from '../access/roles'

/**
 * Archivos de pago (EPUB, PDF, MP3). Nunca son públicos:
 * se entregan sólo por /api/descargas/[id], que verifica la compra
 * y redirige a una URL firmada que expira.
 */
export const ProtectedFiles: CollectionConfig = {
  slug: 'protected-files',
  labels: { singular: 'Archivo protegido', plural: 'Archivos protegidos' },
  admin: { group: 'Archivos', description: 'EPUB, PDF y audios. No son accesibles públicamente.' },
  access: { read: staffOnly, create: staffOnly, update: staffOnly, delete: staffOnly },
  fields: [
    {
      name: 'kind',
      label: 'Tipo',
      type: 'select',
      required: true,
      options: [
        { label: 'EPUB', value: 'epub' },
        { label: 'PDF', value: 'pdf' },
        { label: 'Audio', value: 'audio' },
      ],
    },
  ],
  upload: {
    mimeTypes: ['application/epub+zip', 'application/pdf', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a'],
  },
}
