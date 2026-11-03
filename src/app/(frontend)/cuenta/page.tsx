import type { Metadata } from 'next'
import { headers as getHeaders } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { isStaff } from '@/access/roles'
import { LogoutButton } from '@/components/cuenta/LogoutButton'
import { PasswordForm } from '@/components/cuenta/PasswordForm'
import { ProfileForm } from '@/components/cuenta/ProfileForm'
import { getPayloadClient } from '@/lib/payload'
import '../styles/cuenta.css'

export const metadata: Metadata = { title: 'Mi cuenta', robots: { index: false } }

export default async function MiCuenta() {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) redirect('/cuenta/ingresar?volver=/cuenta')
  const firstName = user.name?.trim().split(/\s+/)[0]

  return (
    <div className="account">
      <header className="account-head">
        <h1>Mi cuenta</h1>
        <p>
          {firstName ? `Hola, ${firstName}. ` : ''}Ingresaste con <strong>{user.email}</strong>.
        </p>
      </header>

      <div className="account-grid">
        <div className="account-main">
          <section className="account-card" aria-labelledby="cuenta-datos">
            <h2 id="cuenta-datos">Tus datos</h2>
            <p className="account-card__lead">Los usamos en tus pedidos y en tu boleta.</p>
            <ProfileForm userId={user.id} name={user.name} phone={user.phone} rut={user.rut} />
          </section>

          <section className="account-card" aria-labelledby="cuenta-clave">
            <h2 id="cuenta-clave">Contraseña</h2>
            <p className="account-card__lead">Para cambiarla, escribe primero la que usas ahora.</p>
            <PasswordForm userId={user.id} email={user.email} />
          </section>
        </div>

        <div className="account-aside">
          <section className="account-card" aria-labelledby="cuenta-biblioteca">
            <h2 id="cuenta-biblioteca">Mi biblioteca</h2>
            <p className="account-card__lead">Tus ebooks, audiolibros y pedidos.</p>
            <Link className="btn" href="/biblioteca">
              Ir a Mi biblioteca
            </Link>
          </section>

          {isStaff(user) && (
            <section className="account-card" aria-labelledby="cuenta-panel">
              <h2 id="cuenta-panel">Panel de la editorial</h2>
              <p className="account-card__lead">Libros, pedidos, noticias y configuración del sitio.</p>
              <Link className="btn secondary" href="/admin">
                Ir al panel
              </Link>
            </section>
          )}

          <section className="account-card" aria-labelledby="cuenta-sesion">
            <h2 id="cuenta-sesion">Cerrar sesión</h2>
            <p className="account-card__lead">¿Usas un computador compartido? Cierra sesión al terminar.</p>
            <LogoutButton />
          </section>
        </div>
      </div>
    </div>
  )
}
