import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthForm } from '@/components/AuthForm'
import { AuthCard } from '@/components/cuenta/AuthCard'
import { volverParam, volverQuery } from '@/lib/safe-redirect'

export const metadata: Metadata = { title: 'Recuperar contraseña', robots: { index: false } }

export default async function Page({ searchParams }: { searchParams: Promise<{ volver?: string | string[] }> }) {
  const q = volverQuery(volverParam((await searchParams).volver))
  return (
    <AuthCard
      title="Recupera tu contraseña"
      lead="Escribe el correo de tu cuenta y te enviaremos un enlace para elegir una contraseña nueva."
      links={
        <>
          <p>
            ¿La recordaste? <Link href={`/cuenta/ingresar${q}`}>Ingresa</Link>
          </p>
          <p>
            ¿No tienes cuenta? <Link href={`/cuenta/registro${q}`}>Crea una gratis</Link>
          </p>
        </>
      }
    >
      <AuthForm mode="recuperar" />
    </AuthCard>
  )
}
