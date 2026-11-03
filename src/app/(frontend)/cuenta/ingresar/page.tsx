import type { Metadata } from 'next'
import { headers as getHeaders } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/AuthForm'
import { AuthCard } from '@/components/cuenta/AuthCard'
import { getPayloadClient } from '@/lib/payload'
import { volverParam, volverQuery } from '@/lib/safe-redirect'

export const metadata: Metadata = { title: 'Ingresar', robots: { index: false } }

export default async function Page({ searchParams }: { searchParams: Promise<{ volver?: string | string[] }> }) {
  const next = volverParam((await searchParams).volver)
  // Con la sesión ya iniciada no hace falta volver a ingresar.
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (user) redirect(next ?? '/cuenta')
  const q = volverQuery(next)

  return (
    <AuthCard
      title="Ingresar"
      lead="Entra a tu cuenta para leer, escuchar y comprar."
      links={
        <>
          <p>
            ¿No tienes cuenta? <Link href={`/cuenta/registro${q}`}>Crea una gratis</Link>
          </p>
          <p>
            <Link href="/cuenta/recuperar">¿Olvidaste tu contraseña?</Link>
          </p>
        </>
      }
    >
      <AuthForm mode="ingresar" next={next} />
    </AuthCard>
  )
}
