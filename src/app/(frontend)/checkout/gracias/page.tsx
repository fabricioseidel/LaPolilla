import Link from 'next/link'
import { ClearCart } from './ClearCart'

export const metadata = { title: 'Gracias por tu compra' }

export default function Gracias() {
  return (
    <section>
      <ClearCart />
      <h1>¡Gracias por tu compra!</h1>
      <p>Te enviamos un email con los detalles. En unos minutos tu libro aparecerá en tu biblioteca.</p>
      <Link className="btn" href="/biblioteca">Ir a mi biblioteca</Link>
    </section>
  )
}
