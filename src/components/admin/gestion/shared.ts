/**
 * Utilidades del panel de gestión (Resumen, exportación CSV, etiquetas).
 * Sólo se usan en el servidor: componentes de servidor del panel y rutas /api/gestion.
 */
import type { Payload } from 'payload'
import { formatAdminURL } from 'payload/shared'
import type { Order, User } from '@/payload-types'

/** Las fechas se muestran y se filtran en hora de Chile (el servidor corre en UTC). */
export const ZONA_CHILE = 'America/Santiago'

/** Estados que cuentan como venta: el pago ya está confirmado. */
export const ESTADOS_VENTA = ['pagado', 'preparando', 'enviado', 'entregado'] satisfies Order['status'][]

export const NOMBRE_ESTADO: Record<Order['status'], string> = {
  pendiente: 'Pendiente de pago',
  pagado: 'Pagado',
  preparando: 'Preparando envío',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
  reembolsado: 'Reembolsado',
}

export const NOMBRE_PASARELA: Record<Order['gateway'], string> = {
  mercadopago: 'Mercado Pago',
  lemonsqueezy: 'Lemon Squeezy',
}

type ConRol = Pick<User, 'role'> | { role?: string | null } | null | undefined

/** Ventas, exportación y despacho: sólo administradora y jefa de edición. */
export const puedeVerVentas = (user: ConRol) => user?.role === 'admin' || user?.role === 'editora'

/** URL relativa dentro del panel, respetando `routes.admin`. */
export const urlPanel = (payload: Payload, path: `/${string}`) =>
  formatAdminURL({ adminRoute: payload.config.routes.admin, path, relative: true })

/** Lista de pedidos filtrada por estado, en el formato que entiende el filtro del panel. */
export const urlPedidosPorEstado = (payload: Payload, estado: Order['status'], orden = '-createdAt') =>
  urlPanel(payload, `/collections/orders?where[or][0][and][0][status][equals]=${estado}&sort=${orden}`)

/** $20.490 o US$7,99 (formato chileno para ambas monedas). */
export const dinero = (n: number | null | undefined, moneda: 'CLP' | 'USD') => {
  const decimales = moneda === 'CLP' ? 0 : 2
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: moneda,
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(n ?? 0)
}

/** "2 nov, 20:31" en hora de Chile. */
export const fechaHoraCorta = (iso: string) =>
  new Intl.DateTimeFormat('es-CL', {
    timeZone: ZONA_CHILE,
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso))

/** "2026-11-02 20:31" en hora de Chile (Excel lo reconoce como fecha y hora). */
export const fechaHoraISO = (iso: string) => {
  const p = partesChile(new Date(iso))
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`
}

/** "martes, 3 de noviembre de 2026" */
export const fechaLarga = (d = new Date()) =>
  new Intl.DateTimeFormat('es-CL', { timeZone: ZONA_CHILE, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d)

/** "octubre de 2026" para el día AAAA-MM-DD */
export const nombreMes = (ymd: string) =>
  new Intl.DateTimeFormat('es-CL', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(new Date(`${ymd}T12:00:00Z`))

function partesChile(d: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA_CHILE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(d)
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '00'
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') }
}

/** Diferencia (ms) entre la hora de Chile y UTC en un instante dado. */
function desfaseChile(d: Date) {
  const p = partesChile(d)
  const comoUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second)
  return comoUTC - Math.floor(d.getTime() / 1000) * 1000
}

/** Hoy en Chile, AAAA-MM-DD */
export const hoyChile = (d = new Date()) => {
  const p = partesChile(d)
  return `${p.year}-${p.month}-${p.day}`
}

/** ¿Es una fecha real con formato AAAA-MM-DD? */
export const esFechaValida = (s: unknown): s is string => {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const [y, m, d] = s.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d))
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d
}

export const sumarDias = (ymd: string, dias: number) => {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + dias)).toISOString().slice(0, 10)
}

/** Instante (UTC) en que empieza el día AAAA-MM-DD en Chile, considerando el horario de verano. */
export const inicioDiaChile = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number)
  const medianoche = Date.UTC(y, m - 1, d)
  const t1 = medianoche - desfaseChile(new Date(medianoche))
  const t2 = medianoche - desfaseChile(new Date(t1))
  // El día en que empieza el horario de verano no existe la medianoche: el día parte a la 01:00.
  return new Date(hoyChile(new Date(t2)) === ymd ? t2 : t1)
}

/** Primer y último día del mes (en Chile), desplazado `meses` hacia atrás o adelante. */
export const rangoMes = (meses = 0, hoy = hoyChile()) => {
  const [y, m] = hoy.split('-').map(Number)
  const inicio = new Date(Date.UTC(y, m - 1 + meses, 1))
  const fin = new Date(Date.UTC(y, m + meses, 0))
  return { desde: inicio.toISOString().slice(0, 10), hasta: fin.toISOString().slice(0, 10) }
}

/** Enlace de descarga del CSV de ventas. */
export const urlCSV = (desde: string, hasta: string) => `/api/gestion/pedidos.csv?desde=${desde}&hasta=${hasta}`
