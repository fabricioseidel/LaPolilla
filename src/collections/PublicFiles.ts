import type { CollectionConfig } from 'payload'
import { publicRead, staffOnly } from '../access/roles'

/** Archivos públicos: muestras gratuitas en PDF, muestras de audio (MP3/M4A) y dossiers de prensa. */
export const PublicFiles: CollectionConfig = {
  slug: 'media-public-files',
  labels: { singular: 'Archivo público', plural: 'Archivos públicos' },
  admin: { group: 'Archivos', description: 'PDF y audios (MP3/M4A) que cualquiera puede ver o escuchar, como las muestras gratuitas.' },
  access: { read: publicRead, create: staffOnly, update: staffOnly, delete: staffOnly },
  fields: [{ name: 'description', label: 'Descripción', type: 'text' }],
  upload: { mimeTypes: ['application/pdf', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a'] },
}
