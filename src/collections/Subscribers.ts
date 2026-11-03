import type { CollectionConfig } from 'payload'
import { staffOnly } from '../access/roles'

/**
 * Personas inscritas en el boletín. Sólo se agregan desde /api/newsletter (con overrideAccess).
 * La fecha de inscripción es `createdAt` (columna «Fecha de creación» en el panel).
 */
export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  labels: { singular: 'Suscriptor del boletín', plural: 'Suscriptores del boletín' },
  admin: {
    group: 'Comunicación',
    useAsTitle: 'email',
    defaultColumns: ['email', 'origen', 'createdAt'],
    description: 'Personas inscritas en el boletín desde el sitio. Si alguien pide darse de baja, elimínala de esta lista.',
  },
  defaultSort: '-createdAt',
  access: {
    create: () => false,
    read: staffOnly,
    update: staffOnly,
    delete: staffOnly,
  },
  fields: [
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      unique: true,
      hooks: { beforeValidate: [({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value)] },
    },
    {
      name: 'origen',
      label: 'Origen',
      type: 'text',
      admin: { readOnly: true, description: 'Dónde se inscribió: portada, noticias, contacto…' },
    },
  ],
}
