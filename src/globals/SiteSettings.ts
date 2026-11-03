import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/roles'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Configuración del sitio',
  access: { read: () => true, update: ({ req }) => isAdmin(req.user as never) || req.user?.role === 'editora' },
  fields: [
    { name: 'tagline', label: 'Lema', type: 'text', defaultValue: 'Libros que vuelan de noche' },
    {
      name: 'social',
      label: 'Redes',
      type: 'group',
      fields: [
        { name: 'instagram', type: 'text' },
        { name: 'youtube', type: 'text' },
      ],
    },
    { name: 'contactEmail', label: 'Email de contacto', type: 'email' },
    {
      name: 'shippingRates',
      label: 'Tarifas de envío (CLP)',
      type: 'array',
      admin: { description: 'Tarifa plana por región. Más adelante se puede reemplazar por cotización automática.' },
      fields: [
        { name: 'region', label: 'Región', type: 'text', required: true },
        { name: 'price', label: 'Precio', type: 'number', required: true },
      ],
    },
    { name: 'pickupEnabled', label: 'Permitir retiro en persona', type: 'checkbox', defaultValue: false },
  ],
}
