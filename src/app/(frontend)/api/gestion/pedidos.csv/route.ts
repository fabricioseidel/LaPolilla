import type { Book, Order, User } from '@/payload-types'
import {
  ESTADOS_VENTA,
  NOMBRE_ESTADO,
  NOMBRE_PASARELA,
  esFechaValida,
  fechaHoraISO,
  hoyChile,
  inicioDiaChile,
  rangoMes,
  sumarDias,
} from '@/components/admin/gestion/shared'
import { paginaError, sesionGestion } from '../_lib/sesion'

/**
 * Ventas para contabilidad y boletas (sólo admin y editora):
 * GET /api/gestion/pedidos.csv?desde=AAAA-MM-DD&hasta=AAAA-MM-DD
 *
 * - Fechas en hora de Chile, ambas inclusive. Sin fechas: el mes en curso.
 * - Incluye los pedidos pagados (pagado, preparando, enviado, entregado).
 * - Pensado para Excel en español: UTF-8 con BOM, separador `;` y coma decimal.
 */
export async function GET(req: Request) {
  const sesion = await sesionGestion(req, 'ventas')
  if (sesion.error) return sesion.error
  const { payload, user } = sesion

  const params = new URL(req.url).searchParams
  const hoy = hoyChile()
  const desde = params.get('desde') || rangoMes(0, hoy).desde
  const hasta = params.get('hasta') || hoy
  if (!esFechaValida(desde) || !esFechaValida(hasta))
    return paginaError(400, 'Fechas no válidas', 'Escribe las fechas como AAAA-MM-DD, por ejemplo 2026-10-31.')
  if (desde > hasta) return paginaError(400, 'Fechas no válidas', 'La fecha «desde» debe ser anterior o igual a la fecha «hasta».')

  const { docs } = await payload.find({
    collection: 'orders',
    user,
    overrideAccess: false,
    pagination: false,
    sort: 'createdAt',
    depth: 1,
    populate: { users: { name: true, rut: true }, books: { title: true } },
    where: {
      and: [
        { status: { in: ESTADOS_VENTA } },
        { createdAt: { greater_than_equal: inicioDiaChile(desde).toISOString() } },
        { createdAt: { less_than: inicioDiaChile(sumarDias(hasta, 1)).toISOString() } },
      ],
    },
  })

  const filas: string[][] = [
    ['Fecha', 'N° pedido', 'Cliente', 'Email', 'RUT', 'Productos', 'Subtotal', 'Envío', 'Total', 'Moneda', 'Pasarela', 'Estado', 'Folio boleta'],
    ...docs.map((p) => {
      const cliente = typeof p.user === 'object' && p.user ? (p.user as User) : null
      return [
        fechaHoraISO(p.createdAt),
        String(p.id),
        cliente?.name || p.shippingAddress?.name || '',
        p.email,
        cliente?.rut || '',
        productos(p),
        monto(p.subtotal, p.currency),
        monto(p.shipping ?? 0, p.currency),
        monto(p.total, p.currency),
        p.currency,
        NOMBRE_PASARELA[p.gateway] ?? p.gateway,
        NOMBRE_ESTADO[p.status] ?? p.status,
        p.invoice?.folio || '',
      ]
    }),
  ]

  const csv = '﻿' + filas.map((fila) => fila.map(celda).join(';')).join('\r\n') + '\r\n'
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="ventas-la-polilla_${desde}_a_${hasta}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}

/** "La polilla y la lámpara × 2 (físico) | Cuentos para no dormir × 1 (digital)" */
function productos(p: Order) {
  return p.items
    .map((i) => {
      const titulo = typeof i.book === 'object' ? (i.book as Book).title : `Libro ${i.book}`
      return `${titulo} × ${i.quantity ?? 1} (${i.format === 'fisico' ? 'físico' : 'digital'})`
    })
    .join(' | ')
}

/** Excel en español usa coma decimal: 7,99 (CLP sin decimales). */
const monto = (n: number, moneda: Order['currency']) => (moneda === 'CLP' ? String(Math.round(n)) : n.toFixed(2).replace('.', ','))

/** Escapa una celda: comillas dobladas y, si hace falta, entre comillas. Evita que Excel ejecute fórmulas. */
function celda(valor: string) {
  let v = valor.replace(/\r?\n|\r/g, ' ')
  if (/^[=+\-@\t]/.test(v)) v = `'${v}`
  return /[;"]|^\s|\s$/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}
