'use client'
import { useId, useState } from 'react'

/** Campo de contraseña con botón para mostrarla u ocultarla. */
export function PasswordField({
  label,
  name = 'password',
  autoComplete,
  minLength,
  hint,
}: {
  label: string
  name?: string
  autoComplete: 'current-password' | 'new-password'
  minLength?: number
  hint?: string
}) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="password-field">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          minLength={minLength}
          required
          autoCapitalize="none"
          spellCheck={false}
          aria-describedby={hint ? `${id}-hint` : undefined}
        />
        <button
          type="button"
          className="password-toggle"
          aria-controls={id}
          aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
    </div>
  )
}
