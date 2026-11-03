'use client'
import { useState } from 'react'

/** Sólo rutas internas, para evitar redirecciones a otros sitios. */
const safeNext = (next?: string) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '/biblioteca')

/** Formularios de cuenta usando la API REST de Payload (cookies httpOnly). */
export function AuthForm({ mode, token, next }: { mode: 'ingresar' | 'registro' | 'recuperar' | 'restablecer'; token?: string; next?: string }) {
  const [msg, setMsg] = useState('')

  async function submit(form: FormData) {
    const email = form.get('email')
    const password = form.get('password')
    const req = (path: string, body: object) =>
      fetch(`/api/users${path}`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

    let res: Response
    if (mode === 'registro') {
      res = await req('', { email, password, name: form.get('name') })
      if (res.ok) res = await req('/login', { email, password })
    } else if (mode === 'ingresar') res = await req('/login', { email, password })
    else if (mode === 'recuperar') res = await req('/forgot-password', { email })
    else res = await req('/reset-password', { token, password })

    if (!res.ok)
      return setMsg(
        mode === 'registro' ? 'No se pudo crear la cuenta. ¿Ya tienes una con ese email?' : 'Algo salió mal. Revisa los datos.',
      )
    if (mode === 'recuperar') return setMsg('Si el email está registrado, te enviamos un enlace para cambiar la contraseña.')
    window.location.href = safeNext(next)
  }

  return (
    <form action={submit} className="auth">
      {mode === 'registro' && <label>Nombre <input name="name" autoComplete="name" /></label>}
      {mode !== 'restablecer' && <label>Email <input name="email" type="email" autoComplete="email" required /></label>}
      {mode !== 'recuperar' && (
        <label>
          Contraseña
          <input name="password" type="password" minLength={8} autoComplete={mode === 'ingresar' ? 'current-password' : 'new-password'} required />
        </label>
      )}
      <button className="btn">Continuar</button>
      {msg && <p role="status">{msg}</p>}
    </form>
  )
}
