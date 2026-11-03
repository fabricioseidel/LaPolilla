import { headers as getHeaders } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'

/**
 * Guarda el avance del audiolibro: { bookId, chapter, seconds }.
 * El reproductor lo llama cada 15 s, al pausar, al cambiar de capítulo y al salir de la página (sendBeacon).
 */
export async function POST(req: Request) {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  let body: { bookId?: unknown; chapter?: unknown; seconds?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }
  const bookId = Number(body.bookId)
  if (!Number.isInteger(bookId) || bookId <= 0) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  const chapter = Math.max(0, Math.floor(Number(body.chapter) || 0))
  const seconds = Math.max(0, Math.floor(Number(body.seconds) || 0))

  const ent = await payload.find({
    collection: 'entitlements',
    overrideAccess: true,
    limit: 1,
    where: { and: [{ user: { equals: user.id } }, { book: { equals: bookId } }] },
  })
  if (!ent.docs[0]) return NextResponse.json({ error: 'No tienes este libro' }, { status: 403 })
  await payload.update({
    collection: 'entitlements',
    id: ent.docs[0].id,
    overrideAccess: true,
    data: { audioProgress: { chapter, seconds } },
  })
  return NextResponse.json({ ok: true })
}
