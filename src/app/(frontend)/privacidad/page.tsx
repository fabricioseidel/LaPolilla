import type { Metadata } from 'next'
import { LegalDocument } from '@/components/institucional/LegalDocument'
import { loadRichText } from '@/lib/institucional/load-texts'
import '../styles/institucional.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: 'Qué datos personales recopila Editorial La Polilla, para qué los usa y cómo ejercer tus derechos.',
}

export default async function Privacidad() {
  const { data, pending } = await loadRichText('privacidad')
  return (
    <>
      <header className="inst-page-head">
        <p className="inst-eyebrow">Legal</p>
        <h1>Política de privacidad</h1>
        <p className="inst-lead">Qué datos recopilamos, para qué los usamos y cuáles son tus derechos.</p>
      </header>
      <LegalDocument
        data={data}
        notice={
          pending && (
            <>
              <p>
                <strong>Texto de referencia: debe revisarlo un abogado.</strong> Es una plantilla general basada en la Ley N° 19.628
                sobre Protección de la Vida Privada. Ten en cuenta que la Ley N° 21.719, que la modifica, entra en vigencia en
                diciembre de 2026.
              </p>
              <p>
                Antes de abrir la tienda, pide que la revisen y completa los datos entre corchetes [ ] desde el panel: Contenido →
                Textos del sitio → Privacidad.
              </p>
            </>
          )
        }
      />
    </>
  )
}
