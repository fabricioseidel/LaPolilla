import Link from 'next/link'
import { AuthForm } from '@/components/AuthForm'

export const metadata = { title: 'Recuperar contraseña' }

export default async function Page({ searchParams }: { searchParams: Promise<{ volver?: string }> }) {
  const { volver } = await searchParams
  const q = volver ? `?volver=${encodeURIComponent(volver)}` : ''
  return (
    <section>
      <h1>Recuperar contraseña</h1>
      <AuthForm mode="recuperar" next={volver} />
      <p>
        <Link href={`/cuenta/ingresar${q}`}>Ingresar</Link> · <Link href={`/cuenta/registro${q}`}>Crear cuenta</Link> ·{' '}
        <Link href="/cuenta/recuperar">Olvidé mi contraseña</Link>
      </p>
    </section>
  )
}
