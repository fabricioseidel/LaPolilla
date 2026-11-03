'use client'
import Link from 'next/link'
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { safeRedirect } from '@/lib/safe-redirect'
import { FormFeedback, LOCKED_ERROR, NETWORK_ERROR, isLocked, readError, usersApi, type Feedback } from './cuenta/feedback'
import { PasswordField } from './cuenta/PasswordField'

type Mode = 'ingresar' | 'registro' | 'recuperar' | 'restablecer'

const SUBMIT: Record<Mode, [idle: string, busy: string]> = {
  ingresar: ['Ingresar', 'Ingresando…'],
  registro: ['Crear cuenta', 'Creando tu cuenta…'],
  recuperar: ['Enviar enlace', 'Enviando…'],
  restablecer: ['Guardar contraseña', 'Guardando…'],
}

/**
 * Formularios de cuenta con la API REST de Payload (cookie httpOnly).
 * `next` (el parámetro ?volver=) sólo se usa si es una ruta interna: ver safeRedirect.
 */
export function AuthForm({ mode, token, next }: { mode: Mode; token?: string; next?: string }) {
  const id = useId()
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const q = next ? `?volver=${encodeURIComponent(next)}` : ''
  const goTo = (path: string) => window.location.assign(path) // recarga completa: el sitio lee la nueva sesión

  const fail = (text: ReactNode) => {
    setFeedback({ tone: 'error', text })
    setBusy(false)
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')
    setBusy(true)
    setFeedback(null)
    try {
      if (mode === 'ingresar') {
        const res = await usersApi('/login', 'POST', { email, password })
        if (!res.ok) {
          const { message } = await readError(res)
          return fail(
            isLocked(message)
              ? LOCKED_ERROR
              : res.status === 401
                ? 'El correo o la contraseña no coinciden. Revisa que estén bien escritos.'
                : 'No pudimos iniciar tu sesión. Intenta de nuevo en unos minutos.',
          )
        }
        return goTo(safeRedirect(next))
      }

      if (mode === 'registro') {
        const res = await usersApi('', 'POST', { email, password, name: String(form.get('name') ?? '').trim() })
        if (!res.ok) {
          const { fields } = await readError(res)
          if (fields.some((f) => f.path === 'email'))
            return fail(
              <>
                Ya existe una cuenta con ese correo. <Link href={`/cuenta/ingresar${q}`}>Ingresa</Link> o{' '}
                <Link href="/cuenta/recuperar">recupera tu contraseña</Link>.
              </>,
            )
          return fail('No pudimos crear tu cuenta. Revisa los datos e intenta de nuevo.')
        }
        const login = await usersApi('/login', 'POST', { email, password })
        return goTo(login.ok ? safeRedirect(next) : `/cuenta/ingresar${q}`)
      }

      if (mode === 'recuperar') {
        const res = await usersApi('/forgot-password', 'POST', { email })
        if (!res.ok) return fail('No pudimos enviar el correo. Intenta de nuevo en unos minutos.')
        setFeedback({
          tone: 'ok',
          text: 'Listo. Si hay una cuenta con ese correo, te enviamos un enlace para elegir una contraseña nueva. Revisa también la carpeta de spam.',
        })
        return setBusy(false)
      }

      const res = await usersApi('/reset-password', 'POST', { token, password })
      if (!res.ok)
        return fail(
          res.status === 403 ? (
            <>
              Este enlace venció o ya se usó. <Link href="/cuenta/recuperar">Pide uno nuevo</Link>.
            </>
          ) : (
            'No pudimos guardar tu contraseña. Intenta de nuevo en unos minutos.'
          ),
        )
      // Payload deja la sesión iniciada. El equipo editorial vuelve al panel.
      const json = await res.json().catch(() => null)
      const role = json?.user?.role
      return goTo(role && role !== 'cliente' ? '/admin' : safeRedirect(next))
    } catch {
      fail(NETWORK_ERROR)
    }
  }

  const [idle, working] = SUBMIT[mode]
  return (
    <form className="auth" onSubmit={onSubmit} aria-busy={busy}>
      {mode === 'registro' && (
        <div className="field">
          <label htmlFor={`${id}-name`}>Nombre</label>
          <input id={`${id}-name`} name="name" autoComplete="name" required />
        </div>
      )}
      {mode !== 'restablecer' && (
        <div className="field">
          <label htmlFor={`${id}-email`}>Correo electrónico</label>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            autoComplete={mode === 'recuperar' ? 'email' : 'username'}
            inputMode="email"
            spellCheck={false}
            required
          />
        </div>
      )}
      {mode === 'ingresar' && <PasswordField label="Contraseña" autoComplete="current-password" />}
      {(mode === 'registro' || mode === 'restablecer') && (
        <PasswordField
          label={mode === 'registro' ? 'Contraseña' : 'Nueva contraseña'}
          autoComplete="new-password"
          minLength={8}
          hint="Mínimo 8 caracteres. Mejor si es una frase que te acuerdes."
        />
      )}
      <div>
        <FormFeedback feedback={feedback} />
        <button className="btn" disabled={busy}>
          {busy ? working : idle}
        </button>
      </div>
      {mode === 'registro' && (
        <p className="auth-legal">
          Al crear tu cuenta aceptas los <Link href="/terminos">Términos y condiciones</Link> y la{' '}
          <Link href="/privacidad">Política de privacidad</Link>.
        </p>
      )}
    </form>
  )
}
