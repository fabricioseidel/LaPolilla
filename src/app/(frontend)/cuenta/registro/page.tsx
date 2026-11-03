import type { Metadata } from 'next'
import { headers as getHeaders } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/AuthForm'
import { AuthCard } from '@/components/cuenta/AuthCard'
import { getPayloadClient } from '@/lib/payload'
import { volverParam, volverQuery } from '@/lib/safe-redirect'

export const metadata: Metadata = { title: 'Crear cuenta', robots: { index: false } }

export default async function Page({ searchParams }: { searchParams: Promise<{ volver?: string | string[] }> }) {
  const next = volverParam((await searchParams).volver)
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (user) redirect(next ?? '/cuenta')
  const q = volverQuery(next)

  return (
    <AuthCard
      title="Crear cuenta"
      lead="Todo lo que compres quedará en Mi biblioteca, con el audiolibro incluido."
      links={
        <p>
          ¿Ya tienes cuenta? <Link href={`/cuenta/ingresar${q}`}>Ingresa</Link>
        </p>
      }
    >
      <AuthForm mode="registro" next={next} />
    </AuthCard>
  )
}
