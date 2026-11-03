import type { ReactNode } from 'react'
import { MothMark } from '@/components/Logo'
import '../../app/(frontend)/styles/cuenta.css'

/** Tarjeta centrada para ingresar, crear cuenta y recuperar o restablecer la contraseña. */
export function AuthCard({
  title,
  lead,
  links,
  children,
}: {
  title: string
  lead?: ReactNode
  /** Enlaces a las otras páginas de cuenta (cada uno en su línea). */
  links?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-card__mark">
          <MothMark size={56} color="var(--gold)" />
        </div>
        <h1 id="auth-title">{title}</h1>
        {lead && <p className="auth-card__lead">{lead}</p>}
        {children}
        {links && (
          <nav className="auth-links" aria-label="Otras opciones de tu cuenta">
            {links}
          </nav>
        )}
      </section>
    </div>
  )
}
