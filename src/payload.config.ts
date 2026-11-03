import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig } from 'payload'
import { es } from '@payloadcms/translations/languages/es'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Authors } from './collections/Authors'
import { Books } from './collections/Books'
import { Entitlements } from './collections/Entitlements'
import { Illustrations } from './collections/Illustrations'
import { Media } from './collections/Media'
import { Orders } from './collections/Orders'
import { Posts } from './collections/Posts'
import { ProtectedFiles } from './collections/ProtectedFiles'
import { PublicFiles } from './collections/PublicFiles'
import { Users } from './collections/Users'
import { SiteSettings } from './globals/SiteSettings'
import { PROTECTED_PREFIX } from './lib/storage'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SITE_URL,
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' · La Polilla' },
    components: {
      graphics: {
        Logo: '/components/admin/AdminLogo',
        Icon: '/components/admin/AdminIcon',
      },
      // Resumen de la operación (pedidos por despachar, ventas, stock, exportación) y accesos rápidos.
      beforeDashboard: ['/components/admin/gestion/Resumen'],
      beforeNavLinks: ['/components/admin/gestion/NavEnlaces#NavInicio'],
      afterNavLinks: ['/components/admin/gestion/NavEnlaces#NavGuia'],
      views: {
        // Guía de uso (docs/GUIA-EDITORIAL.md) dentro del panel: /admin/guia
        guia: { Component: '/components/admin/gestion/GuiaView', path: '/guia', meta: { title: 'Guía de uso' } },
      },
    },
    importMap: { baseDir: path.resolve(dirname) },
  },
  i18n: { supportedLanguages: { es }, fallbackLanguage: 'es' },
  collections: [Books, Authors, Illustrations, Posts, Orders, Entitlements, Media, PublicFiles, ProtectedFiles, Users],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    // Esquema propio: así las tablas NO quedan expuestas por la API REST pública de Supabase.
    schemaName: 'payload',
    // En Vercel cada instancia es efímera: pocas conexiones y que se liberen rápido.
    // DATABASE_URL debe apuntar al pooler de Supabase en modo transacción (puerto 6543).
    pool: {
      connectionString: process.env.DATABASE_URL || '',
      max: process.env.VERCEL ? 2 : 10,
      idleTimeoutMillis: process.env.VERCEL ? 5000 : 10000,
    },
    migrationDir: path.resolve(dirname, 'migrations'),
    // El esquema se maneja con migraciones. PAYLOAD_DB_PUSH=true sólo para bases locales de prueba.
    push: process.env.PAYLOAD_DB_PUSH === 'true',
  }),
  email: process.env.RESEND_API_KEY
    ? resendAdapter({
        apiKey: process.env.RESEND_API_KEY,
        defaultFromAddress: process.env.EMAIL_FROM || 'hola@editoriallapolilla.cl',
        defaultFromName: 'Editorial La Polilla',
      })
    : undefined, // en desarrollo los emails se muestran en consola
  sharp,
  plugins: [
    // Un único bucket PRIVADO en Supabase Storage. Imágenes y muestras se sirven
    // a través de Payload (que aplica `read: publicRead`); los archivos protegidos
    // sólo se entregan con URL firmada desde /api/descargas.
    s3Storage({
      enabled: Boolean(process.env.S3_BUCKET),
      collections: {
        media: { prefix: 'media' },
        'media-public-files': { prefix: 'publicos' },
        'protected-files': { prefix: PROTECTED_PREFIX },
      },
      bucket: process.env.S3_BUCKET || '',
      config: {
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION || 'us-east-1',
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
      },
    }),
  ],
})
