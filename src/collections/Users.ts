import type { CollectionConfig } from 'payload'
import { adminFieldOnly, adminOnly, isStaff, staffOrOwner } from '../access/roles'
import { resetPasswordEmailHTML, sendWelcomeEmail } from '../lib/email'
import { RESET_PASSWORD_SUBJECT } from '../lib/email-templates'

/** Vigencia del enlace para cambiar la contraseña (el correo lo menciona). */
const RESET_LINK_MS = 60 * 60 * 1000

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Usuario', plural: 'Usuarios' },
  admin: { useAsTitle: 'email', group: 'Cuentas' },
  auth: {
    verify: false,
    maxLoginAttempts: 10,
    forgotPassword: {
      expiration: RESET_LINK_MS,
      generateEmailSubject: () => RESET_PASSWORD_SUBJECT,
      // Enlace a /cuenta/restablecer?token=… con la plantilla del sitio (src/lib/email-templates.ts).
      generateEmailHTML: (args) =>
        resetPasswordEmailHTML(args?.req?.payload, {
          token: args?.token,
          user: args?.user,
          expiresInMinutes: RESET_LINK_MS / 60_000,
        }),
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
  hooks: {
    afterChange: [
      // Bienvenida a cada cliente nuevo. Nunca bloquea ni hace fallar el registro.
      async ({ doc, operation, req }) => {
        if (operation !== 'create' || doc.role !== 'cliente') return doc
        const send = () =>
          sendWelcomeEmail(req.payload, doc).catch((err) =>
            req.payload.logger.error({ err, userId: doc.id }, 'No se pudo enviar el correo de bienvenida'),
          )
        try {
          // Se envía después de responder: el registro no espera al servidor de correo.
          const { after } = await import('next/server')
          after(send)
        } catch {
          await send() // fuera de una petición de Next.js (scripts, CLI de Payload)
        }
        return doc
      },
    ],
  },
}
