import type { Metadata } from 'next'
import { LegalDocument } from '@/components/institucional/LegalDocument'
import { loadRichText } from '@/lib/institucional/load-texts'
import '../styles/institucional.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Términos y condiciones',
  description: 'Condiciones de compra de Editorial La Polilla: formatos, pagos, envíos, derecho a retracto y garantía.',
}

export default async function Terminos() {
  const { data, pending } = await loadRichText('terminos')
  return (
    <>
      <header className="inst-page-head">
        <p className="inst-eyebrow">Legal</p>
        <h1>Términos y condiciones</h1>
        <p className="inst-lead">Cómo funcionan las compras, los envíos, el derecho a retracto y las devoluciones.</p>
      </header>
      <LegalDocument
        data={data}
        notice={
          pending && (
            <>
              <p>
                <strong>Texto de referencia: debe revisarlo un abogado.</strong> Es una plantilla general para una tienda en línea en
                Chile, basada en la Ley N° 19.496 sobre Protección de los Derechos de los Consumidores.
              </p>
              <p>
                Antes de abrir la tienda, pide que la revisen y completa los datos entre corchetes [ ] desde el panel: Contenido →
                Textos del sitio → Términos y condiciones.
              </p>
            </>
          )
        }
      />
    </>
  )
}
