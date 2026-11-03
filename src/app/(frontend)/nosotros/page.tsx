import type { Metadata } from 'next'
import Link from 'next/link'
import { RichTextContent } from '@/components/institucional/RichTextContent'
import { MothMark } from '@/components/Logo'
import { loadRichText } from '@/lib/institucional/load-texts'
import { getPayloadClient } from '@/lib/payload'
import '../styles/institucional.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Nosotros',
  description: 'Conoce Editorial La Polilla: una editorial chilena pequeña que publica libros digitales, impresos y audiolibros.',
}

export default async function Nosotros() {
  const payload = await getPayloadClient()
  const [{ data }, settings] = await Promise.all([
    loadRichText('nosotros'),
    payload.findGlobal({ slug: 'site-settings', depth: 0 }).catch(() => null),
  ])
  return (
    <>
      <div className="about-head">
        <header className="inst-page-head">
          <p className="inst-eyebrow">La editorial</p>
          <h1>Nosotros</h1>
          {settings?.tagline && <p className="inst-lead">{settings.tagline}</p>}
        </header>
        <div className="home-moth" aria-hidden="true">
          <MothMark size={200} color="var(--gold)" />
        </div>
      </div>

      <RichTextContent data={data} />

      <div className="about-cta">
        <section className="inst-card" aria-labelledby="cta-libros">
          <h2 id="cta-libros">Nuestros libros</h2>
          <p>Cada libro, en digital, en papel y en audiolibro.</p>
          <Link className="btn" href="/libros">
            Ver los libros
          </Link>
        </section>
        <section className="inst-card" aria-labelledby="cta-contacto">
          <h2 id="cta-contacto">Conversemos</h2>
          <p>¿Una pregunta, una invitación o una idea? Nos encantará leerte.</p>
          <Link className="btn secondary" href="/contacto">
            Escríbenos
          </Link>
        </section>
      </div>
    </>
  )
}
