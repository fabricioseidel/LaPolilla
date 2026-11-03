import Link from 'next/link'
import { CartCount } from './CartCount'

export function Header() {
  return (
    <header className="site-header">
      <Link href="/" className="logo">La Polilla</Link>
      <nav>
        <Link href="/libros">Libros</Link>
        <Link href="/galeria">Ilustraciones</Link>
        <Link href="/blog">Noticias</Link>
        <Link href="/biblioteca">Mi biblioteca</Link>
        <Link href="/carrito">Carrito <CartCount /></Link>
      </nav>
    </header>
  )
}
