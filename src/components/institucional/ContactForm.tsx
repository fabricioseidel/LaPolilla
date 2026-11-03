'use client'
import Link from 'next/link'
import { useId, useRef, useState, type FormEvent } from 'react'
import { LIMITS, MIN_FILL_MS, validateContact, type FieldErrors } from '@/lib/institucional/form-rules'
import { Field, FormMessages, Honeypot, formValues } from './FormParts'
import { useProtectedSubmit } from './useProtectedSubmit'

const ORDER = ['nombre', 'email', 'asunto', 'mensaje'] as const

/** Formulario de contacto. `token` lo genera el servidor al dibujar la página (anti-spam). */
export function ContactForm({ token }: { token: string }) {
  const id = useId()
  const formRef = useRef<HTMLFormElement>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [sending, setSending] = useState(false)
  const submit = useProtectedSubmit('/api/contacto', token, MIN_FILL_MS.contacto)

  const focusFirst = (errs: FieldErrors) => {
    const first = ORDER.find((k) => errs[k])
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (sending) return
    const form = e.currentTarget
    const data = formValues(form)
    setSuccess('')
    const errs = validateContact(data)
    if (Object.keys(errs).length) {
      setErrors(errs)
      setError('Revisa los campos marcados.')
      focusFirst(errs)
      return
    }
    setErrors({})
    setError('')
    setSending(true)
    const res = await submit(data)
    setSending(false)
    if (res.ok) {
      setSuccess(res.message ?? '¡Gracias por escribirnos!')
      form.reset()
    } else {
      setErrors(res.fields ?? {})
      setError(res.error ?? 'No pudimos enviar tu mensaje. Inténtalo de nuevo.')
      if (res.fields) focusFirst(res.fields)
    }
  }

  /** Al corregir un campo, se quita su aviso de error. */
  const clearError = (name: string) => {
    if (errors[name as keyof FieldErrors]) setErrors(({ [name as keyof FieldErrors]: _, ...rest }) => rest)
  }

  return (
    <form
      ref={formRef}
      className="inst-form"
      action="/api/contacto"
      method="post"
      noValidate
      onSubmit={onSubmit}
      onInput={(e) => clearError((e.target as HTMLInputElement).name)}
    >
      <p className="inst-form-hint">Todos los campos son obligatorios.</p>
      <div className="inst-form-row">
        <Field id={`${id}-nombre`} label="Nombre" error={errors.nombre}>
          {(a11y) => <input {...a11y} name="nombre" autoComplete="name" maxLength={LIMITS.nombre} required />}
        </Field>
        <Field id={`${id}-email`} label="Email" hint="Te responderemos a este correo." error={errors.email}>
          {(a11y) => (
            <input {...a11y} name="email" type="email" inputMode="email" autoComplete="email" maxLength={LIMITS.email} required />
          )}
        </Field>
      </div>
      <Field id={`${id}-asunto`} label="Asunto" error={errors.asunto}>
        {(a11y) => <input {...a11y} name="asunto" maxLength={LIMITS.asunto} required />}
      </Field>
      <Field id={`${id}-mensaje`} label="Mensaje" error={errors.mensaje}>
        {(a11y) => <textarea {...a11y} name="mensaje" rows={7} maxLength={LIMITS.mensaje} required />}
      </Field>
      <Honeypot />
      <input type="hidden" name="token" value={token} />
      <p className="inst-form-hint">
        Usaremos tus datos sólo para responderte. Más información en nuestra <Link href="/privacidad">política de privacidad</Link>.
      </p>
      <div className="inst-form-actions">
        <button className="btn" type="submit" disabled={sending}>
          {sending ? 'Enviando…' : 'Enviar mensaje'}
        </button>
      </div>
      <FormMessages success={success} error={error} />
    </form>
  )
}
