import Link from 'next/link'
import { AuthForm } from '@/components/AuthForm'

export const metadata = { title: 'Crear cuenta' }

export default function Page() {
  return (
    <section>
      <h1>Crear cuenta</h1>
      <AuthForm mode="registro" />
      <p><Link href="/cuenta/ingresar">Ingresar</Link> · <Link href="/cuenta/registro">Crear cuenta</Link> · <Link href="/cuenta/recuperar">Olvidé mi contraseña</Link></p>
    </section>
  )
}
