import type { DefaultNodeTypes, SerializedLinkNode } from '@payloadcms/richtext-lexical'
import { RichText, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import Link from 'next/link'
import { headingIdFactory, nodeText, type RichTextData } from '@/lib/institucional/richtext'

/** Rutas públicas de los documentos que se pueden enlazar desde el editor. */
const ROUTES: Record<string, string> = { posts: '/blog', books: '/libros', authors: '/autores' }

function internalHref(fields: SerializedLinkNode['fields']) {
  const doc = fields.doc
  const value = doc?.value
  if (!doc || !value || typeof value !== 'object') return '#'
  const slug = (value as { slug?: unknown }).slug
  const base = ROUTES[doc.relationTo]
  return base && typeof slug === 'string' ? `${base}/${slug}` : '#'
}

/**
 * Texto enriquecido con estilo de lectura.
 * - Los títulos llevan un id (para el índice y enlaces como /terminos#derecho-a-retracto).
 * - Un «Título 1» del editor se muestra como h2: la página ya tiene su propio h1.
 * - Los enlaces internos navegan sin recargar la página.
 */
export function RichTextContent({ data, className = 'inst-prose' }: { data: RichTextData; className?: string }) {
  const nextId = headingIdFactory()

  const converters: JSXConvertersFunction<DefaultNodeTypes> = ({ defaultConverters }) => ({
    ...defaultConverters,
    heading: ({ node, nodesToJSX }) => {
      const text = nodeText(node).trim()
      const id = text ? nextId(text) : undefined
      const Tag = node.tag === 'h1' ? 'h2' : node.tag
      return <Tag id={id}>{nodesToJSX({ nodes: node.children })}</Tag>
    },
    link: ({ node, nodesToJSX }) => {
      const children = nodesToJSX({ nodes: node.children })
      const href = node.fields.linkType === 'internal' ? internalHref(node.fields) : (node.fields.url ?? '#')
      if (node.fields.newTab)
        return (
          <a href={href} target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        )
      if (href.startsWith('/') && !href.startsWith('//')) return <Link href={href}>{children}</Link>
      return <a href={href}>{children}</a>
    },
  })

  return <RichText data={data as never} converters={converters} className={className} />
}
