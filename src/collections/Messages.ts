import type { CollectionConfig } from 'payload'
import { staffOnly } from '../access/roles'

/**
 * Mensajes del formulario de /contacto.
 * Sólo se crean desde /api/contacto (con overrideAccess): nadie puede crearlos desde el panel ni por la API REST.
 * El equipo los lee, responde por email y los marca como «Respondido».
 */
export const Messages: CollectionConfig = {
  slug: 'messages',
  labels: { singular: 'Mensaje de contacto', plural: 'Mensajes de contacto' },
  admin: {
    group: 'Comunicación',
    useAsTitle: 'asunto',
    defaultColumns: ['asunto', 'nombre', 'email', 'estado', 'createdAt'],
    listSearchableFields: ['nombre', 'email', 'asunto'],
    description:
      'Mensajes enviados desde la página de contacto. Respóndelos desde tu correo y luego cambia el estado a «Respondido».',
  },
  defaultSort: '-createdAt',
  access: {
    create: () => false,
    read: staffOnly,
    update: staffOnly,
    delete: staffOnly,
  },
  fields: [
    { name: 'nombre', label: 'Nombre', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'email', label: 'Email', type: 'email', required: true, admin: { readOnly: true } },
    { name: 'asunto', label: 'Asunto', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'mensaje', label: 'Mensaje', type: 'textarea', required: true, admin: { readOnly: true, rows: 12 } },
    {
      name: 'estado',
      label: 'Estado',
      type: 'select',
      required: true,
      defaultValue: 'nuevo',
      options: [
        { label: 'Nuevo', value: 'nuevo' },
        { label: 'Respondido', value: 'respondido' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
