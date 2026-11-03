'use client'
import { useCallback, useEffect, useRef } from 'react'
import type { FormResponse } from '@/lib/institucional/form-rules'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const NETWORK_ERROR: FormResponse = {
  ok: false,
  code: 'server',
  error: 'No pudimos conectarnos. Revisa tu conexión a internet e inténtalo de nuevo.',
}

async function postJson(endpoint: string, data: Record<string, string>): Promise<FormResponse> {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
    })
    const json = (await res.json().catch(() => null)) as FormResponse | null
    return json ?? { ok: false, code: 'server', error: 'Algo salió mal. Inténtalo de nuevo en unos minutos.' }
  } catch {
    return NETWORK_ERROR
  }
}

/**
 * Envía un formulario protegido contra spam.
 * Respeta el tiempo mínimo de llenado (si alguien envía muy rápido, espera en silencio)
 * y, si la página estuvo abierta tanto tiempo que el token venció, reintenta una vez con uno nuevo.
 */
export function useProtectedSubmit(endpoint: string, initialToken: string, minMs: number) {
  const shownAt = useRef(0)
  const token = useRef(initialToken)

  useEffect(() => {
    shownAt.current = Date.now()
  }, [])

  return useCallback(
    async (data: Record<string, string>): Promise<FormResponse> => {
      const wait = shownAt.current + minMs + 250 - Date.now()
      if (wait > 0) await sleep(wait)

      let res = await postJson(endpoint, { ...data, token: token.current })
      if (!res.ok && (res.code === 'expired' || res.code === 'too_fast')) {
        if (res.token) token.current = res.token
        await sleep(minMs + 250)
        res = await postJson(endpoint, { ...data, token: token.current })
      }
      return res
    },
    [endpoint, minMs],
  )
}
