import type { ReactNode } from 'react'
import { HONEYPOT_FIELD } from '@/lib/institucional/form-rules'

/** Campo trampa: queda fuera de la pantalla y del lector de pantalla; las personas no lo ven. */
export function Honeypot() {
  return (
    <div className="inst-hp" aria-hidden="true">
      <label>
        Sitio web (déjalo en blanco)
        <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  )
}

/** Valores de texto de un formulario. */
export const formValues = (form: HTMLFormElement) =>
  Object.fromEntries([...new FormData(form)].map(([k, v]) => [k, typeof v === 'string' ? v : ''])) as Record<string, string>

type A11yProps = { id: string; 'aria-invalid'?: true; 'aria-describedby'?: string }

/** Etiqueta, ayuda y error asociados a un control (con aria-invalid y aria-describedby). */
export function Field(props: {
  id: string
  label: string
  hint?: ReactNode
  error?: string
  children: (a11y: A11yProps) => ReactNode
}) {
  const hintId = `${props.id}-ayuda`
  const errorId = `${props.id}-error`
  const describedBy = [props.hint && hintId, props.error && errorId].filter(Boolean).join(' ')
  return (
    <div className="inst-field">
      <label htmlFor={props.id}>{props.label}</label>
      {props.hint && (
        <p id={hintId} className="inst-field-hint">
          {props.hint}
        </p>
      )}
      {props.children({
        id: props.id,
        'aria-invalid': props.error ? true : undefined,
        'aria-describedby': describedBy || undefined,
      })}
      {props.error && (
        <p id={errorId} className="inst-field-error">
          {props.error}
        </p>
      )}
    </div>
  )
}

/** Zonas de aviso que los lectores de pantalla anuncian: éxito (status) y error (alert). */
export function FormMessages({ success, error }: { success: string; error: string }) {
  return (
    <>
      <p role="alert" className="inst-form-error">
        {error}
      </p>
      <p role="status" className="inst-form-success">
        {success}
      </p>
    </>
  )
}
