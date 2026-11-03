import type { Metadata } from 'next'
import Link from 'next/link'
import { ContactForm } from '@/components/institucional/ContactForm'
import { IconArrow, IconMail } from '@/components/institucional/Icons'
import { SocialLinks } from '@/components/institucional/SocialLinks'
import { issueFormToken } from '@/lib/institucional/form-server'
import { safeEmail, socialLinks } from '@/lib/institucional/site'
import { getPayloadClient } from '@/lib/payload'
import '../styles/institucional.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Escríbele a Editorial La Polilla: consultas sobre pedidos, presentaciones, ferias o lo que quieras contarnos.',
}

export default async function Contacto() {
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 }).catch(() => null)
  const email = safeEmail(settings?.contactEmail)
  const social = settings ? socialLinks(settings) : []

  return (
    <>
      <header className="inst-page-head">
        <p className="inst-eyebrow">Conversemos</p>
        <h1>Contacto</h1>
        <p className="inst-lead">
          ¿Tienes una pregunta sobre un pedido, quieres invitarnos a una feria o contarnos qué te pareció un libro? Escríbenos.
        </p>
      </header>

      <div className="contact-layout">
        <section aria-labelledby="formulario">
          <h2 id="formulario" className="inst-visually-hidden">
            Formulario de contacto
          </h2>
          <ContactForm token={issueFormToken()} />
        </section>

        <aside className="contact-aside" aria-label="Otras formas de contacto">
          <section className="inst-card" aria-labelledby="antes">
            <h2 id="antes">Antes de escribir</h2>
            <p>Quizás tu respuesta ya está en las preguntas frecuentes: compras, descargas, audiolibros, envíos y devoluciones.</p>
            <Link className="inst-more" href="/preguntas-frecuentes">
              Ver preguntas frecuentes <IconArrow size={18} />
            </Link>
          </section>
          {email && (
            <section className="inst-card" aria-labelledby="correo">
              <h2 id="correo">Por correo</h2>
              <p>También puedes escribirnos directamente:</p>
              <a className="contact-email" href={`mailto:${email}`}>
                <IconMail size={20} />
                {email}
              </a>
            </section>
          )}
          {social.length > 0 && (
            <section className="inst-card" aria-labelledby="redes">
              <h2 id="redes">En redes</h2>
              <SocialLinks links={social} />
            </section>
          )}
        </aside>
      </div>
    </>
  )
}
