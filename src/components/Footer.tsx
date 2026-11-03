import Link from 'next/link'
import { getPayloadClient } from '@/lib/payload'
import { currentYear, safeEmail, socialLinks } from '@/lib/institucional/site'
import '@/app/(frontend)/styles/institucional.css'
import { IconMail } from './institucional/Icons'
import { SocialLinks } from './institucional/SocialLinks'
import { Logo } from './Logo'

const COLUMNS = [
  {
    title: 'Tienda',
    links: [
      { href: '/libros', label: 'Libros' },
      { href: '/galeria', label: 'Ilustraciones' },
      { href: '/carrito', label: 'Carrito' },
      { href: '/biblioteca', label: 'Mi biblioteca' },
    ],
  },
  {
    title: 'Editorial',
    links: [
      { href: '/nosotros', label: 'Nosotros' },
      { href: '/autores', label: 'Autoras y autores' },
      { href: '/blog', label: 'Noticias' },
      { href: '/#boletin', label: 'Boletín' },
    ],
  },
  {
    title: 'Ayuda',
    links: [
      { href: '/preguntas-frecuentes', label: 'Preguntas frecuentes' },
      { href: '/terminos#envios', label: 'Envíos' },
      { href: '/contacto', label: 'Contacto' },
      { href: '/cuenta', label: 'Mi cuenta' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/terminos', label: 'Términos y condiciones' },
      { href: '/terminos#derecho-a-retracto', label: 'Derecho a retracto' },
      { href: '/privacidad', label: 'Política de privacidad' },
    ],
  },
]

export async function Footer() {
  let settings: { tagline?: string | null; contactEmail?: string | null; social?: { instagram?: string | null; youtube?: string | null } } = {}
  try {
    settings = await (await getPayloadClient()).findGlobal({ slug: 'site-settings', depth: 0 })
  } catch {
    // Sin base de datos el pie igual se muestra, sólo sin lema ni redes.
  }
  const email = safeEmail(settings.contactEmail)
  const social = socialLinks(settings)

  return (
    <footer className="colophon">
      <div className="colophon-inner">
        <div className="colophon-brand">
          <Link href="/" className="colophon-logo" aria-label="Editorial La Polilla, inicio">
            <Logo size={44} />
          </Link>
          {settings.tagline && <p className="colophon-tagline">{settings.tagline}</p>}
          <p>Libros digitales, impresos y audiolibros, hechos en Chile.</p>
          {email && (
            <p>
              <a className="colophon-email" href={`mailto:${email}`}>
                <IconMail size={20} />
                {email}
              </a>
            </p>
          )}
          <SocialLinks links={social} className="inst-social colophon-social" />
        </div>

        <nav className="colophon-nav" aria-label="Pie de página">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2>{col.title}</h2>
              <ul>
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="colophon-bottom">
        <p>© {currentYear()} Editorial La Polilla. Todos los derechos reservados.</p>
      </div>
    </footer>
  )
}
