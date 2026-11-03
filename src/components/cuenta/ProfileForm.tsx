'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useId, useRef, useState, type FormEvent } from 'react'
import { cleanRut, formatRut, isValidRut } from '@/lib/rut'
import { FormFeedback, NETWORK_ERROR, usersApi, type Feedback } from './feedback'

/** Mensaje de error del RUT, o '' si está bien (o vacío: es opcional). */
function rutProblem(value: string) {
  if (!value.trim()) return ''
  if (!/^\d{7,8}[0-9K]$/.test(cleanRut(value).replace(/^0+/, '')))
    return 'Escribe el RUT completo, con su dígito verificador. Por ejemplo: 12.345.678-5.'
  return isValidRut(value) ? '' : 'El dígito verificador no coincide. Revisa el RUT.'
}

/** Nombre, teléfono y RUT del cliente (PATCH /api/users/:id con su propia sesión). */
export function ProfileForm(props: { userId: number; name?: string | null; phone?: string | null; rut?: string | null }) {
  const id = useId()
  const router = useRouter()
  const rutInput = useRef<HTMLInputElement>(null)
  const [rut, setRut] = useState(props.rut ?? '')
  const [rutError, setRutError] = useState('')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const problem = rutProblem(rut)
    setRutError(problem)
    if (problem) return rutInput.current?.focus()

    const text = (key: string) => String(form.get(key) ?? '').trim() || null
    setBusy(true)
    setFeedback(null)
    try {
      const res = await usersApi(`/${props.userId}`, 'PATCH', {
        name: text('name'),
        phone: text('phone'),
        rut: rut.trim() ? formatRut(rut) : null,
      })
      if (res.ok) {
        if (rut.trim()) setRut(formatRut(rut))
        setFeedback({ tone: 'ok', text: 'Listo, guardamos tus datos.' })
        router.refresh() // actualiza el saludo de la página
      } else if (res.status === 401 || res.status === 403) {
        setFeedback({
          tone: 'error',
          text: (
            <>
              Tu sesión se cerró. <Link href="/cuenta/ingresar?volver=/cuenta">Vuelve a ingresar</Link> para guardar
              los cambios.
            </>
          ),
        })
      } else {
        setFeedback({ tone: 'error', text: 'No pudimos guardar tus datos. Intenta de nuevo en unos minutos.' })
      }
    } catch {
      setFeedback({ tone: 'error', text: NETWORK_ERROR })
    }
    setBusy(false)
  }

  return (
    <form className="account-form" onSubmit={onSubmit} aria-busy={busy}>
      <div className="field">
        <label htmlFor={`${id}-name`}>Nombre</label>
        <input id={`${id}-name`} name="name" autoComplete="name" defaultValue={props.name ?? ''} />
      </div>
      <div className="field">
        <label htmlFor={`${id}-phone`}>Teléfono (opcional)</label>
        <input
          id={`${id}-phone`}
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="+56 9 1234 5678"
          defaultValue={props.phone ?? ''}
          aria-describedby={`${id}-phone-hint`}
        />
        <p id={`${id}-phone-hint`} className="field-hint">
          Por si necesitamos contactarte por un pedido.
        </p>
      </div>
      <div className="field">
        <label htmlFor={`${id}-rut`}>RUT (opcional)</label>
        <input
          ref={rutInput}
          id={`${id}-rut`}
          name="rut"
          autoComplete="off"
          spellCheck={false}
          placeholder="12.345.678-5"
          value={rut}
          onChange={(e) => {
            setRut(e.target.value)
            if (rutError) setRutError(rutProblem(e.target.value))
          }}
          onBlur={() => {
            const problem = rutProblem(rut)
            setRutError(problem)
            if (!problem && rut.trim()) setRut(formatRut(rut))
          }}
          aria-invalid={rutError ? true : undefined}
          aria-describedby={`${id}-rut-hint${rutError ? ` ${id}-rut-error` : ''}`}
        />
        <p id={`${id}-rut-hint`} className="field-hint">
          Lo usamos para emitir tu boleta electrónica.
        </p>
        {rutError && (
          <p id={`${id}-rut-error`} className="field-error">
            {rutError}
          </p>
        )}
      </div>
      <div>
        <FormFeedback feedback={feedback} />
        <button className="btn" disabled={busy}>
          {busy ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
