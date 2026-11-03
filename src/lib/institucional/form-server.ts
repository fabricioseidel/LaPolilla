import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import type { FormResponse } from './form-rules'

/**
 * Anti-spam de los formularios públicos (sólo servidor).
 * Cada formulario lleva un token firmado con la hora en que se mostró: así sabemos que
 * quien envía cargó la página y que tardó un tiempo razonable en llenarlo.
 */

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // una semana con la página abierta
const MAX_BODY_BYTES = 32 * 1024

const sign = (ts: string) =>
  createHmac('sha256', process.env.PAYLOAD_SECRET || 'la-polilla-formularios').update(`formulario:${ts}`).digest('base64url')

export function issueFormToken(now = Date.now()) {
  const ts = now.toString(36)
  return `${ts}.${sign(ts)}`
}

export type TokenCheck = 'ok' | 'invalid' | 'expired' | 'too_fast'

export function checkFormToken(token: unknown, minMs: number, now = Date.now()): TokenCheck {
  if (typeof token !== 'string' || token.length > 100) return 'invalid'
  const [ts, sig] = token.split('.')
  if (!ts || !sig) return 'invalid'
  const given = Buffer.from(sig)
  const expected = Buffer.from(sign(ts))
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return 'invalid'
  const age = now - parseInt(ts, 36)
  if (!Number.isFinite(age) || age > MAX_AGE_MS) return 'expired'
  if (age < minMs) return 'too_fast'
  return 'ok'
}

export class BodyError extends Error {}

/**
 * Lee el cuerpo como JSON (envío con JavaScript) o como formulario (navegador sin JavaScript).
 * Devuelve sólo valores de texto.
 */
export async function readFormBody(req: Request): Promise<{ data: Record<string, string>; isForm: boolean }> {
  const length = Number(req.headers.get('content-length') ?? 0)
  if (length > MAX_BODY_BYTES) throw new BodyError('Los datos enviados son demasiado largos.')
  const type = req.headers.get('content-type') ?? ''
  const data: Record<string, string> = {}
  if (type.includes('application/json')) {
    const json = await req.json().catch(() => {
      throw new BodyError('No pudimos leer los datos enviados.')
    })
    if (!json || typeof json !== 'object') throw new BodyError('No pudimos leer los datos enviados.')
    for (const [k, v] of Object.entries(json)) if (typeof v === 'string') data[k] = v
    return { data, isForm: false }
  }
  if (type.includes('application/x-www-form-urlencoded') || type.includes('multipart/form-data')) {
    const form = await req.formData().catch(() => {
      throw new BodyError('No pudimos leer los datos enviados.')
    })
    for (const [k, v] of form.entries()) if (typeof v === 'string') data[k] = v
    return { data, isForm: true }
  }
  throw new BodyError('Formato no admitido.')
}

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/** Página mínima para quien envía el formulario sin JavaScript. */
function fallbackPage(body: FormResponse, back: { href: string; label: string }) {
  const title = body.ok ? 'Formulario enviado' : 'No pudimos enviar el formulario'
  const text = body.ok ? body.message : body.error
  const details = Object.values(body.fields ?? {})
  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} · La Polilla</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#1c1830;color:#f3eef9;font:17px/1.6 system-ui,sans-serif;padding:24px}
  main{max-width:520px;background:#2a2347;border:1px solid #3a3356;border-radius:16px;padding:28px}
  h1{font-family:Georgia,serif;font-weight:600;margin:0 0 8px}
  a{display:inline-flex;align-items:center;min-height:44px;margin-top:12px;background:#e8b04b;color:#1c1830;border-radius:999px;padding:10px 22px;font-weight:600;text-decoration:none}
  a:focus-visible{outline:2px solid #e8b04b;outline-offset:3px}
  li{color:#ff9b8a}
</style></head>
<body><main>
  <h1>${escapeHtml(title)}</h1>
  <p ${body.ok ? 'role="status"' : 'role="alert"'}>${escapeHtml(text ?? '')}</p>
  ${details.length ? `<ul>${details.map((d) => `<li>${escapeHtml(d ?? '')}</li>`).join('')}</ul>` : ''}
  ${body.ok ? '' : '<p>Vuelve atrás con el botón de tu navegador para corregir los datos sin perder lo que escribiste.</p>'}
  <a href="${escapeHtml(back.href)}">${escapeHtml(back.label)}</a>
</main></body></html>`
  return new Response(html, {
    status: body.ok ? 200 : 400,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

/** Responde en JSON o, si el envío vino de un formulario sin JavaScript, con una página simple. */
export function formReply(isForm: boolean, status: number, body: FormResponse, back: { href: string; label: string }) {
  if (isForm) return fallbackPage(body, back)
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

/** Respuesta común cuando falla el token (las personas reales casi nunca llegan aquí). */
export function tokenProblem(check: Exclude<TokenCheck, 'ok'>): { status: number; body: FormResponse } {
  if (check === 'too_fast')
    return {
      status: 400,
      body: { ok: false, code: 'too_fast', error: 'Enviaste el formulario muy rápido. Espera unos segundos y vuelve a intentarlo.' },
    }
  return {
    status: 400,
    body: {
      ok: false,
      code: 'expired',
      error: 'El formulario venció porque la página estuvo abierta mucho tiempo. Vuelve a enviarlo.',
      token: issueFormToken(),
    },
  }
}
