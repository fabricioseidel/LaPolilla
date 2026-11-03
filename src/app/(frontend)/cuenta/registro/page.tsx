import Link from 'next/link'
import { AuthForm } from '@/components/AuthForm'

export const metadata = { title: 'Crear cuenta' }

export default async function Page({ searchParams }: { searchParams: Promise<{ volver?: string }> }) {
  const { volver } = await searchParams
  const q = volver ? `?volver=${encodeURIComponent(volver)}` : ''
  return (
    <section>
      <h1>Crear cuenta</h1>
      <AuthForm mode="registro" next={volver} />
      <p>
        <Link href={`/cuenta/ingresar${q}`}>Ingresar</Link> · <Link href={`/cuenta/registro${q}`}>Crear cuenta</Link> ·{' '}
        <Link href="/cuenta/recuperar">Olvidé mi contraseña</Link>
      </p>
    </section>
  )
}
