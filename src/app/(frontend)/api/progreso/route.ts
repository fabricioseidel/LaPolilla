import { headers as getHeaders } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'

/** Guarda el avance del audiolibro: { bookId, chapter, seconds } */
export async function POST(req: Request) {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  const { bookId, chapter, seconds } = await req.json()

  const ent = await payload.find({
    collection: 'entitlements',
    overrideAccess: true,
    limit: 1,
    where: { and: [{ user: { equals: user.id } }, { book: { equals: Number(bookId) } }] },
  })
  if (!ent.docs[0]) return NextResponse.json({ error: 'No tienes este libro' }, { status: 403 })
  await payload.update({
    collection: 'entitlements',
    id: ent.docs[0].id,
    overrideAccess: true,
    data: { audioProgress: { chapter: Number(chapter) || 0, seconds: Number(seconds) || 0 } },
  })
  return NextResponse.json({ ok: true })
}
