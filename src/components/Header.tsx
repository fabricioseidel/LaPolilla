import { headers } from 'next/headers'
import Link from 'next/link'
import { isStaff } from '@/access/roles'
import { getPayloadClient } from '@/lib/payload'
import '@/app/(frontend)/styles/institucional.css'
import { CartCount } from './CartCount'
import { MobileMenu, NavLink, SkipLink } from './institucional/HeaderClient'
import { IconBag, IconUser } from './institucional/Icons'
import { Logo } from './Logo'

const MAIN_LINKS = [
  { href: '/libros', label: 'Libros' },
  { href: '/autores', label: 'Autoras y autores' },
  { href: '/galeria', label: 'Ilustraciones' },
  { href: '/blog', label: 'Noticias' },
  { href: '/nosotros', label: 'Nosotros' },
]

/** Sesión actual, leída en el servidor desde la cookie de Payload. */
async function currentUser() {
  try {
    const payload = await getPayloadClient()
    const { user } = await payload.auth({ headers: await headers() })
    return user
  } catch {
    return null
  }
}

/**
 * Cabecera del sitio. En pantallas anchas muestra toda la navegación;
 * en celulares, el carrito y un menú desplegable.
 * Ojo: vive en el layout, así que tras ingresar o salir hay que recargar la página (o usar router.refresh()).
 */
export async function Header() {
  const user = await currentUser()
  const account = user ? { href: '/cuenta', label: 'Mi cuenta' } : { href: '/cuenta/ingresar', label: 'Ingresar' }
  const staff = isStaff(user as never)

  return (
    <header className="masthead">
      <SkipLink />
      <div className="masthead-inner">
        <Link href="/" className="masthead-logo" aria-label="Editorial La Polilla, inicio">
          <Logo size={40} />
        </Link>

        <nav className="masthead-nav" aria-label="Principal">
          <ul>
            {MAIN_LINKS.map((l) => (
              <li key={l.href}>
                <NavLink href={l.href}>{l.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="masthead-actions">
          <NavLink href="/biblioteca" className="masthead-action masthead-wide">
            Mi biblioteca
          </NavLink>
          {staff && (
            <Link href="/admin" className="masthead-action masthead-wide">
              Panel
            </Link>
          )}
          <NavLink href="/carrito" className="masthead-action masthead-cart">
            <IconBag size={22} />
            <span className="masthead-cart-label">Carrito</span>
            <CartCount />
          </NavLink>
          <NavLink href={account.href} className="masthead-account masthead-wide">
            <IconUser size={18} />
            {account.label}
          </NavLink>

          <MobileMenu>
            <nav aria-label="Menú">
              <ul>
                {MAIN_LINKS.map((l) => (
                  <li key={l.href}>
                    <NavLink href={l.href}>{l.label}</NavLink>
                  </li>
                ))}
              </ul>
              <ul className="masthead-menu-secondary">
                <li>
                  <NavLink href="/biblioteca">Mi biblioteca</NavLink>
                </li>
                <li>
                  <NavLink href={account.href}>{account.label}</NavLink>
                </li>
                {staff && (
                  <li>
                    <Link href="/admin">Panel de administración</Link>
                  </li>
                )}
              </ul>
            </nav>
          </MobileMenu>
        </div>
      </div>
    </header>
  )
}
