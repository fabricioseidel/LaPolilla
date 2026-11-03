import Link from 'next/link'
import { ClearCart } from './ClearCart'

export const metadata = { title: 'Gracias por tu compra' }

export default function Gracias() {
  return (
    <section>
      <ClearCart />
      <h1>¡Gracias por tu compra!</h1>
      <p>En cuanto la pasarela confirme el pago (normalmente en segundos), tu ebook y audiolibro aparecerán en tu biblioteca.</p>
      <p>Si compraste el libro físico, te avisaremos cuando sea despachado.</p>
      <Link className="btn" href="/biblioteca">Ir a mi biblioteca</Link>
    </section>
  )
}
