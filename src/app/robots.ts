import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/seo'

// Va en la raíz de app/: Next no reconoce robots.ts dentro de un grupo de rutas como (frontend).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      // /api/media/file/ son las imágenes públicas (portadas, fotos, ilustraciones): se permiten
      // para que aparezcan en buscadores y en las vistas previas al compartir un enlace.
      allow: ['/', '/api/media/file/'],
      disallow: ['/admin', '/api', '/biblioteca', '/carrito', '/cuenta', '/checkout'],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
