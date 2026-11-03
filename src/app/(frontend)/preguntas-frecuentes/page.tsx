import type { Metadata } from 'next'
import Link from 'next/link'
import { FaqAnswer } from '@/components/institucional/FaqAnswer'
import { IconChevron } from '@/components/institucional/Icons'
import { loadFaq } from '@/lib/institucional/load-texts'
import { headingIdFactory } from '@/lib/institucional/richtext'
import '../styles/institucional.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Preguntas frecuentes',
  description: 'Cómo comprar, descargar tus libros, escuchar los audiolibros, envíos, devoluciones y boletas en Editorial La Polilla.',
}

export default async function PreguntasFrecuentes() {
  const faq = await loadFaq()
  const idFor = headingIdFactory()
  return (
    <>
      <header className="inst-page-head">
        <p className="inst-eyebrow">Ayuda</p>
        <h1>Preguntas frecuentes</h1>
        <p className="inst-lead">
          Cómo comprar, descargar tus libros, escuchar los audiolibros y recibir tus pedidos. Toca una pregunta para ver la respuesta.
        </p>
      </header>

      <div className="faq-list">
        {faq.map((item) => (
          <details key={item.pregunta} className="faq-item" id={idFor(item.pregunta)}>
            <summary>
              <span>{item.pregunta}</span>
              <IconChevron size={22} />
            </summary>
            <div className="faq-answer">
              <FaqAnswer text={item.respuesta} />
            </div>
          </details>
        ))}
      </div>

      <section className="faq-more inst-card" aria-labelledby="mas-ayuda">
        <h2 id="mas-ayuda">¿No encontraste lo que buscabas?</h2>
        <p>Escríbenos y te ayudamos con tu compra, tu pedido o lo que necesites.</p>
        <Link className="btn" href="/contacto">
          Ir a contacto
        </Link>
      </section>
    </>
  )
}
