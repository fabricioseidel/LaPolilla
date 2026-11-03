import { AuthForm } from '@/components/AuthForm'

export const metadata = { title: 'Nueva contraseña' }

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  return (
    <section>
      <h1>Define tu contraseña</h1>
      <AuthForm mode="restablecer" token={token} />
    </section>
  )
}
