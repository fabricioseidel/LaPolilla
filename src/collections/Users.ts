import type { CollectionConfig } from 'payload'
import { adminFieldOnly, adminOnly, isStaff, staffOrOwner } from '../access/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Usuario', plural: 'Usuarios' },
  admin: { useAsTitle: 'email', group: 'Cuentas' },
  auth: {
    verify: false,
    maxLoginAttempts: 10,
    forgotPassword: {
      generateEmailSubject: () => 'Define tu contraseña · Editorial La Polilla',
      generateEmailHTML: (args) => {
        const url = `${process.env.NEXT_PUBLIC_SITE_URL}/cuenta/restablecer?token=${args?.token}`
        return `<p>Para definir o cambiar tu contraseña haz clic aquí:</p><p><a href="${url}">${url}</a></p>`
      },
    },
  },
  access: {
    admin: ({ req }) => isStaff(req.user as never),
    create: () => true, // registro público de clientes
    read: staffOrOwner('id'),
    update: staffOrOwner('id'),
    delete: adminOnly,
  },
  fields: [
    { name: 'name', label: 'Nombre', type: 'text' },
    {
      name: 'role',
      label: 'Rol',
      type: 'select',
      required: true,
      defaultValue: 'cliente',
      saveToJWT: true,
      access: { create: adminFieldOnly, update: adminFieldOnly },
      options: [
        { label: 'Administradora', value: 'admin' },
        { label: 'Jefa de edición', value: 'editora' },
        { label: 'Autora', value: 'autora' },
        { label: 'Cliente', value: 'cliente' },
      ],
    },
    { name: 'phone', label: 'Teléfono', type: 'text' },
    { name: 'rut', label: 'RUT (opcional, para boleta)', type: 'text' },
  ],
}
