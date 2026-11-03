'use client'
import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { FormFeedback, LOCKED_ERROR, NETWORK_ERROR, isLocked, readError, usersApi, type Feedback } from './feedback'
import { PasswordField } from './PasswordField'

/**
 * Cambio de contraseña: primero comprueba la actual (ingresando de nuevo, así también
 * cuenta para el bloqueo por intentos fallidos) y luego guarda la nueva.
 * Payload cierra las demás sesiones abiertas de la cuenta y mantiene ésta.
 */
export function PasswordForm({ userId, email }: { userId: number; email: string }) {
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formEl = e.currentTarget
    const form = new FormData(formEl)
    const current = String(form.get('currentPassword') ?? '')
    const next = String(form.get('newPassword') ?? '')
    if (next === current)
      return setFeedback({ tone: 'error', text: 'La contraseña nueva tiene que ser distinta de la actual.' })

    setBusy(true)
    setFeedback(null)
    try {
      const check = await usersApi('/login', 'POST', { email, password: current })
      if (!check.ok) {
        const { message } = await readError(check)
        setFeedback({
          tone: 'error',
          text: isLocked(message) ? LOCKED_ERROR : 'La contraseña actual no es correcta.',
        })
        return setBusy(false)
      }
      const res = await usersApi(`/${userId}`, 'PATCH', { password: next })
      if (!res.ok) {
        setFeedback({ tone: 'error', text: 'No pudimos cambiar tu contraseña. Intenta de nuevo en unos minutos.' })
        return setBusy(false)
      }
      formEl.reset()
      setFeedback({
        tone: 'ok',
        text: 'Listo, cambiamos tu contraseña. Por seguridad, cerramos tu sesión en otros dispositivos.',
      })
    } catch {
      setFeedback({ tone: 'error', text: NETWORK_ERROR })
    }
    setBusy(false)
  }

  return (
    <form className="account-form" onSubmit={onSubmit} aria-busy={busy}>
      {/* Para que el gestor de contraseñas sepa de qué cuenta se trata */}
      <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
      <PasswordField label="Contraseña actual" name="currentPassword" autoComplete="current-password" />
      <PasswordField
        label="Contraseña nueva"
        name="newPassword"
        autoComplete="new-password"
        minLength={8}
        hint="Mínimo 8 caracteres."
      />
      <div>
        <FormFeedback feedback={feedback} />
        <button className="btn" disabled={busy}>
          {busy ? 'Cambiando…' : 'Cambiar contraseña'}
        </button>
      </div>
      <p className="field-hint">
        ¿No recuerdas la actual?{' '}
        <Link className="auth-inline-link" href="/cuenta/recuperar">
          Te enviamos un enlace para elegir otra
        </Link>
      </p>
    </form>
  )
}
