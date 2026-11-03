import type { Payload } from 'payload'
import { isStaff } from '@/access/roles'
import { puedeVerVentas } from '@/components/admin/gestion/shared'
import { getPayloadClient } from '@/lib/payload'
import type { User } from '@/payload-types'

/**
 * - `equipo`: admin, editora y autora (todo el equipo del panel).
 * - `ventas`: sólo admin y editora (datos de ventas y clientes).
 */
type Acceso = 'equipo' | 'ventas'

type Sesion = { payload: Payload; user: User; error?: undefined } | { error: Response }

/** Verifica la sesión del panel (cookie) y el rol. Sin sesión: 401; sin permiso: 403. */
export async function sesionGestion(req: Request, acceso: Acceso): Promise<Sesion> {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: req.headers })
  if (!user)
    return { error: paginaError(401, 'Tu sesión expiró', 'Ingresa al panel con tu cuenta y vuelve a intentarlo.', true) }
  const permitido = acceso === 'ventas' ? puedeVerVentas(user) : isStaff(user)
  if (!permitido)
    return {
      error: paginaError(
        403,
        'No tienes permiso',
        acceso === 'ventas'
          ? 'Sólo la administradora y la jefa de edición pueden ver y exportar las ventas.'
          : 'Esta página es sólo para el equipo de la editorial.',
      ),
    }
  return { payload, user }
}

/** Escapa texto para insertarlo en HTML (los datos de clientes nunca se insertan sin escapar). */
export const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/** Página de error sencilla: estas rutas se abren en el navegador desde el panel. */
export function paginaError(status: number, titulo: string, mensaje: string, conLogin = false) {
  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(titulo)} · La Polilla</title>
<style>
  body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 48px 16px; background: #fff; color: #1a1a1a; }
  main { max-width: 32rem; margin: 0 auto; }
  h1 { font-size: 1.5rem; margin: 0 0 .5rem; }
  p { line-height: 1.5; }
  a { color: #1a1a1a; font-weight: 600; }
</style>
</head>
<body>
<main>
  <h1>${esc(titulo)}</h1>
  <p>${esc(mensaje)}</p>
  <p><a href="${conLogin ? '/admin/login' : '/admin'}">${conLogin ? 'Ingresar al panel' : 'Volver al panel'}</a></p>
</main>
</body>
</html>`
  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  })
}
