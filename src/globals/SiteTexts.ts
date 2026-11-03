import type { DefaultValue, GlobalConfig, PayloadRequest } from 'payload'
import { isAdmin, staffOnly } from '../access/roles'
import { defaultFaq, defaultNosotros, defaultPrivacidad, defaultTerminos, getTextContext } from '../lib/institucional/textos'

const canEdit = ({ req }: { req: PayloadRequest }) => isAdmin(req.user as never) || req.user?.role === 'editora'

/**
 * Payload espera (await) el valor por defecto, así que puede ser asíncrono: lo usamos para
 * poner el email de contacto real en las plantillas. El tipo oficial no lo refleja.
 */
const asyncDefault = (fn: (args: { req: PayloadRequest }) => Promise<unknown>) => fn as unknown as DefaultValue

/**
 * Textos de las páginas Nosotros, Preguntas frecuentes, Términos y Privacidad.
 * Vienen precargados con una plantilla con datos por completar entre corchetes [ ].
 * Si un texto se deja vacío, el sitio vuelve a mostrar la plantilla.
 */
export const SiteTexts: GlobalConfig = {
  slug: 'site-texts',
  label: 'Textos del sitio',
  admin: {
    group: 'Contenido',
    description:
      'Textos de las páginas Nosotros, Preguntas frecuentes, Términos y condiciones y Privacidad. Reemplaza lo que está entre corchetes [ ]. Si dejas un texto vacío, el sitio muestra el texto de ejemplo.',
  },
  access: { read: () => true, update: canEdit, readVersions: staffOnly },
  versions: { max: 25 },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Nosotros',
          description: 'Se muestra en la página /nosotros.',
          fields: [{ name: 'nosotros', label: 'Página «Nosotros»', type: 'richText', defaultValue: () => defaultNosotros() }],
        },
        {
          label: 'Preguntas frecuentes',
          description: 'Se muestran en /preguntas-frecuentes, en el orden de esta lista (puedes arrastrarlas para ordenarlas).',
          fields: [
            {
              name: 'faq',
              label: 'Preguntas frecuentes',
              type: 'array',
              labels: { singular: 'Pregunta', plural: 'Preguntas' },
              admin: { initCollapsed: true },
              defaultValue: asyncDefault(async ({ req }) => defaultFaq(await getTextContext(req.payload))),
              fields: [
                { name: 'pregunta', label: 'Pregunta', type: 'text', required: true },
                {
                  name: 'respuesta',
                  label: 'Respuesta',
                  type: 'textarea',
                  required: true,
                  admin: {
                    rows: 6,
                    description: 'Deja una línea en blanco para separar párrafos. Para una lista, empieza cada línea con «• ».',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Términos y condiciones',
          description: 'Se muestra en /terminos. Debe revisarlo un abogado antes de publicar la tienda.',
          fields: [
            {
              name: 'terminos',
              label: 'Términos y condiciones',
              type: 'richText',
              defaultValue: asyncDefault(async ({ req }) => defaultTerminos(await getTextContext(req.payload))),
            },
          ],
        },
        {
          label: 'Privacidad',
          description: 'Se muestra en /privacidad. Debe revisarlo un abogado antes de publicar la tienda.',
          fields: [
            {
              name: 'privacidad',
              label: 'Política de privacidad',
              type: 'richText',
              defaultValue: asyncDefault(async ({ req }) => defaultPrivacidad(await getTextContext(req.payload))),
            },
          ],
        },
      ],
    },
  ],
}
