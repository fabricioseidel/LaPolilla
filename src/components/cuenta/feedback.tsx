import type { ReactNode } from 'react'

/** Mensaje de resultado de un formulario de cuenta. */
export type Feedback = { tone: 'error' | 'ok'; text: ReactNode } | null

export const NETWORK_ERROR = 'No pudimos conectarnos. Revisa tu conexión a internet e intenta de nuevo.'
export const LOCKED_ERROR =
  'Por seguridad bloqueamos la cuenta unos minutos después de varios intentos fallidos. Espera un poco y vuelve a intentarlo, o recupera tu contraseña.'

/** API REST de usuarios de Payload, con la cookie de sesión. */
export const usersApi = (path: string, method: 'POST' | 'PATCH', body?: object) =>
  fetch(`/api/users${path}`, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })

/** Mensaje y errores por campo de una respuesta de error de Payload. */
export async function readError(res: Response) {
  const json = await res.json().catch(() => null)
  const first = json?.errors?.[0]
  return {
    message: String(first?.message ?? ''),
    fields: (first?.data?.errors ?? []) as { path?: string; message?: string }[],
  }
}

/** Payload responde 401 tanto por contraseña incorrecta como por cuenta bloqueada. */
export const isLocked = (message: string) => /bloquead|locked/i.test(message)

/**
 * Zonas de aviso que existen siempre (vacías no ocupan espacio), para que los
 * lectores de pantalla anuncien el resultado: "status" para éxito, "alert" para errores.
 */
export function FormFeedback({ feedback }: { feedback: Feedback }) {
  return (
    <div className="form-feedback">
      <div role="status">{feedback?.tone === 'ok' && <p className="form-message is-ok">{feedback.text}</p>}</div>
      <div role="alert">{feedback?.tone === 'error' && <p className="form-message is-error">{feedback.text}</p>}</div>
    </div>
  )
}
