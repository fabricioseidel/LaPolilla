import type { MetadataRoute } from 'next'
import { getPayloadClient } from '@/lib/payload'
import { absoluteUrl } from '@/lib/seo'

// Siempre al día: los libros, autoras y noticias nuevas aparecen sin volver a desplegar.
export const dynamic = 'force-dynamic'

type Entry = MetadataRoute.Sitemap[number]
type Frequency = Entry['changeFrequency']

/** Páginas fijas del sitio. */
const PAGES: [path: string, changeFrequency: Frequency, priority: number][] = [
  ['/', 'weekly', 1],
  ['/libros', 'weekly', 0.9],
  ['/autores', 'monthly', 0.7],
  ['/galeria', 'monthly', 0.6],
  ['/blog', 'weekly', 0.7],
  ['/nosotros', 'yearly', 0.5],
  ['/preguntas-frecuentes', 'monthly', 0.5],
  ['/contacto', 'yearly', 0.4],
  ['/terminos', 'yearly', 0.2],
  ['/privacidad', 'yearly', 0.2],
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = PAGES.map(([path, changeFrequency, priority]) => ({
    url: absoluteUrl(path),
    changeFrequency,
    priority,
  }))

  try {
    const payload = await getPayloadClient()
    // Sin usuario y con overrideAccess: false rigen las mismas reglas de lectura que para el
    // público: sólo libros publicados y noticias publicadas (nunca borradores).
    const query = { depth: 0, pagination: false, overrideAccess: false, select: { slug: true, updatedAt: true } } as const
    const [books, authors, posts] = await Promise.all([
      payload.find({ collection: 'books', ...query }),
      payload.find({ collection: 'authors', ...query }),
      payload.find({ collection: 'posts', ...query }),
    ])
    const entries = (
      prefix: string,
      docs: { slug?: string | null; updatedAt: string }[],
      changeFrequency: Frequency,
      priority: number,
    ): MetadataRoute.Sitemap =>
      docs
        .filter((d) => d.slug)
        .map((d) => ({ url: absoluteUrl(`${prefix}/${d.slug}`), lastModified: d.updatedAt, changeFrequency, priority }))

    return [
      ...pages,
      ...entries('/libros', books.docs, 'weekly', 0.8),
      ...entries('/autores', authors.docs, 'monthly', 0.6),
      ...entries('/blog', posts.docs, 'monthly', 0.6),
    ]
  } catch (err) {
    console.error('sitemap.xml: no se pudo leer el catálogo; se publican sólo las páginas fijas', err)
    return pages
  }
}
