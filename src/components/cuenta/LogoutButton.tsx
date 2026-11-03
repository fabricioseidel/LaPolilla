'use client'
import { useState } from 'react'
import { NETWORK_ERROR } from './feedback'

/** Cierra la sesión (POST /api/users/logout) y vuelve al inicio. */
export function LogoutButton() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function logout() {
    setBusy(true)
    setError('')
    const res = await fetch('/api/users/logout', { method: 'POST', credentials: 'include' }).catch(() => null)
    // 400 = ya no había sesión: el resultado es el mismo.
    if (res && (res.ok || res.status === 400)) return window.location.assign('/')
    setError(res ? 'No pudimos cerrar tu sesión. Intenta de nuevo.' : NETWORK_ERROR)
    setBusy(false)
  }

  return (
    <>
      <button type="button" className="btn secondary" onClick={logout} disabled={busy}>
        {busy ? 'Cerrando sesión…' : 'Cerrar sesión'}
      </button>
      <div role="alert">{error && <p className="field-error">{error}</p>}</div>
    </>
  )
}
