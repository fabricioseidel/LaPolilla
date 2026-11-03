import Link from 'next/link'
import { AuthForm } from '@/components/AuthForm'

export const metadata = { title: 'Recuperar contraseña' }

export default function Page() {
  return (
    <section>
      <h1>Recuperar contraseña</h1>
      <AuthForm mode="recuperar" />
      <p><Link href="/cuenta/ingresar">Ingresar</Link> · <Link href="/cuenta/registro">Crear cuenta</Link> · <Link href="/cuenta/recuperar">Olvidé mi contraseña</Link></p>
    </section>
  )
}
