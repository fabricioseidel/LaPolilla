import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthForm } from '@/components/AuthForm'
import { AuthCard } from '@/components/cuenta/AuthCard'

export const metadata: Metadata = {
  title: 'Nueva contraseña',
  robots: { index: false },
  // El enlace lleva el token en la URL: que no viaje a otros sitios como "referer".
  referrer: 'no-referrer',
}

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const { token } = await searchParams
  const valid = typeof token === 'string' && token.length > 0

  return (
    <AuthCard
      title="Elige una contraseña nueva"
      lead={valid ? 'Al guardarla entrarás directo a tu cuenta.' : undefined}
      links={
        <p>
          ¿El enlace no funciona? <Link href="/cuenta/recuperar">Pide uno nuevo</Link>
        </p>
      }
    >
      {valid ? (
        <AuthForm mode="restablecer" token={token} />
      ) : (
        <p className="form-message is-error">
          Este enlace está incompleto o no es válido. Ábrelo directamente desde el correo que te enviamos, o pide uno
          nuevo.
        </p>
      )}
    </AuthCard>
  )
}
