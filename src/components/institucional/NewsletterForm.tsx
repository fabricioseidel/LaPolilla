'use client'
import Link from 'next/link'
import { useId, useRef, useState, type FormEvent } from 'react'
import { MIN_FILL_MS, validateEmail, type NewsletterSource } from '@/lib/institucional/form-rules'
import { FormMessages, Honeypot, formValues } from './FormParts'
import { useProtectedSubmit } from './useProtectedSubmit'

/** Inscripción al boletín. `token` lo genera el servidor al dibujar la página (anti-spam). */
export function NewsletterForm({ token, source }: { token: string; source: NewsletterSource }) {
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const submit = useProtectedSubmit('/api/newsletter', token, MIN_FILL_MS.boletin)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (sending) return
    const form = e.currentTarget
    const data = formValues(form)
    setSuccess('')
    const problem = validateEmail(data.email)
    if (problem) {
      setError(problem)
      input.current?.focus()
      return
    }
    setError('')
    setSending(true)
    const res = await submit(data)
    setSending(false)
    if (res.ok) {
      setSuccess(res.message ?? '¡Listo! Tu email quedó inscrito.')
      form.reset()
    } else {
      setError(res.fields?.email ?? res.error ?? 'No pudimos inscribirte. Inténtalo de nuevo.')
      input.current?.focus()
    }
  }

  const emailId = `${id}-email`
  const hintId = `${id}-ayuda`
  return (
    <form className="inst-newsletter" action="/api/newsletter" method="post" noValidate onSubmit={onSubmit}>
      <label htmlFor={emailId}>Tu email</label>
      <div className="inst-newsletter-row">
        <input
          ref={input}
          id={emailId}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="nombre@correo.cl"
          maxLength={254}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={hintId}
          onInput={() => error && setError('')}
        />
        <button className="btn" type="submit" disabled={sending}>
          {sending ? 'Inscribiendo…' : 'Inscribirme'}
        </button>
      </div>
      <Honeypot />
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="origen" value={source} />
      <p id={hintId} className="inst-form-hint">
        Te puedes dar de baja cuando quieras. Lee nuestra <Link href="/privacidad">política de privacidad</Link>.
      </p>
      <FormMessages success={success} error={error} />
    </form>
  )
}
