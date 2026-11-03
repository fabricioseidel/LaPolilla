const BASE = 'https://la-polilla.invalid'

/**
 * Devuelve `value` sólo si es una ruta interna del sitio ("/carrito", "/libros/x?y=1");
 * si no, `fallback`. Evita redirecciones abiertas: "//otro.sitio", "/\otro.sitio",
 * "https://…", "javascript:…" o rutas con tabulaciones y saltos de línea.
 * Sirve tanto en el servidor como en el navegador.
 */
export function safeRedirect(value: unknown, fallback = '/biblioteca'): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return fallback
  try {
    const url = new URL(value, BASE)
    if (url.origin !== BASE) return fallback
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return fallback
  }
}

/** El parámetro ?volver= de las páginas de cuenta: la ruta interna, o undefined si falta o no es segura. */
export const volverParam = (value: unknown) => safeRedirect(value, '') || undefined

/** "?volver=/carrito" para seguir pasando el destino entre páginas de cuenta. */
export const volverQuery = (path?: string) => (path ? `?volver=${encodeURIComponent(path)}` : '')
