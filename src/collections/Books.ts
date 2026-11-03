import type { CollectionConfig } from 'payload'
import { publicRead, staffOnly } from '../access/roles'
import { slugField } from './fields/slug'

/**
 * Un libro se compra en formato digital o físico.
 * Cualquier compra desbloquea en "Mi biblioteca": ebook (EPUB/PDF) + audiolibro.
 */
export const Books: CollectionConfig = {
  slug: 'books',
  labels: { singular: 'Libro', plural: 'Libros' },
  admin: { useAsTitle: 'title', group: 'Catálogo', defaultColumns: ['title', 'status', 'stock'] },
  access: {
    read: ({ req }) => (req.user && req.user.role !== 'cliente' ? true : { status: { equals: 'publicado' } }),
    create: staffOnly,
    update: staffOnly,
    delete: staffOnly,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Información',
          fields: [
            { name: 'title', label: 'Título', type: 'text', required: true },
            { name: 'subtitle', label: 'Subtítulo', type: 'text' },
            { name: 'authors', label: 'Autoría', type: 'relationship', relationTo: 'authors', hasMany: true },
            { name: 'cover', label: 'Portada', type: 'upload', relationTo: 'media' },
            { name: 'synopsis', label: 'Sinopsis', type: 'richText' },
            { name: 'sample', label: 'Muestra gratuita (PDF, pública)', type: 'upload', relationTo: 'media-public-files' },
            { name: 'trailerYoutube', label: 'Video YouTube (booktrailer o fragmento de audio)', type: 'text' },
            {
              type: 'row',
              fields: [
                { name: 'isbn', label: 'ISBN', type: 'text' },
                { name: 'pages', label: 'Páginas', type: 'number' },
                { name: 'publishedAt', label: 'Fecha de publicación', type: 'date' },
              ],
            },
            { name: 'genres', label: 'Géneros', type: 'text', hasMany: true },
          ],
        },
        {
          label: 'Precios y stock',
          fields: [
            {
              type: 'collapsible',
              label: 'Digital (ebook + audiolibro)',
              fields: [
                { name: 'digitalEnabled', label: 'Disponible en digital', type: 'checkbox', defaultValue: true },
                {
                  type: 'row',
                  fields: [
                    { name: 'priceDigitalCLP', label: 'Precio Chile (CLP)', type: 'number', min: 0 },
                    { name: 'priceDigitalUSD', label: 'Precio internacional (USD)', type: 'number', min: 0 },
                  ],
                },
              ],
            },
            {
              type: 'collapsible',
              label: 'Físico (sólo envíos en Chile, incluye ebook + audiolibro)',
              fields: [
                { name: 'physicalEnabled', label: 'Disponible en físico', type: 'checkbox', defaultValue: true },
                { name: 'pricePhysicalCLP', label: 'Precio (CLP)', type: 'number', min: 0 },
                {
                  name: 'fulfillment',
                  label: 'Modo de despacho',
                  type: 'select',
                  defaultValue: 'stock',
                  options: [
                    { label: 'Stock propio', value: 'stock' },
                    { label: 'Impresión bajo demanda', value: 'pod' },
                  ],
                },
                {
                  name: 'stock',
                  label: 'Ejemplares en stock',
                  type: 'number',
                  min: 0,
                  defaultValue: 0,
                  admin: { condition: (d) => d?.fulfillment === 'stock' },
                },
                {
                  name: 'weightGrams',
                  label: 'Peso (g) para envío',
                  type: 'number',
                  defaultValue: 400,
                },
              ],
            },
          ],
        },
        {
          label: 'Archivos y audiolibro',
          fields: [
            { name: 'epub', label: 'EPUB', type: 'upload', relationTo: 'protected-files' },
            { name: 'pdf', label: 'PDF', type: 'upload', relationTo: 'protected-files' },
            {
              name: 'audioChapters',
              label: 'Capítulos del audiolibro',
              type: 'array',
              labels: { singular: 'Capítulo', plural: 'Capítulos' },
              fields: [
                { name: 'title', label: 'Título', type: 'text', required: true },
                { name: 'file', label: 'Audio', type: 'upload', relationTo: 'protected-files', required: true },
                { name: 'durationSec', label: 'Duración (seg)', type: 'number' },
              ],
            },
          ],
        },
      ],
    },
    slugField('title'),
    {
      name: 'status',
      label: 'Estado',
      type: 'select',
      defaultValue: 'borrador',
      admin: { position: 'sidebar' },
      options: [
        { label: 'Borrador', value: 'borrador' },
        { label: 'Preventa', value: 'preventa' },
        { label: 'Publicado', value: 'publicado' },
      ],
    },
    { name: 'featured', label: 'Destacado en inicio', type: 'checkbox', admin: { position: 'sidebar' } },
  ],
}
