import Link from 'next/link'
import { CartCount } from './CartCount'
import { Logo } from './Logo'

export function Header() {
  return (
    <header className="site-header">
      <Link href="/" className="logo" aria-label="Editorial La Polilla, inicio">
        <Logo size={44} />
      </Link>
      <nav aria-label="Principal">
        <Link href="/libros">Libros</Link>
        <Link href="/galeria">Ilustraciones</Link>
        <Link href="/blog">Noticias</Link>
        <Link href="/biblioteca">Mi biblioteca</Link>
        <Link href="/carrito" className="nav-cart">Carrito <CartCount /></Link>
      </nav>
    </header>
  )
}
