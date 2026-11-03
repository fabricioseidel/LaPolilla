import { headers as getHeaders } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import { signedUrl } from '@/lib/storage'

/**
 * Entrega un EPUB/PDF/audio sólo si el usuario tiene el libro en su biblioteca.
 * ?modo=stream para el reproductor (no fuerza descarga).
 */
export async function GET(req: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) return NextResponse.redirect(new URL('/cuenta/ingresar', req.url))

  const file = await payload.findByID({ collection: 'protected-files', id: Number(fileId), overrideAccess: true }).catch(() => null)
  if (!file?.filename) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  // ¿A qué libro pertenece este archivo?
  const books = await payload.find({
    collection: 'books',
    overrideAccess: true,
    depth: 0,
    limit: 1,
    where: { or: [{ epub: { equals: file.id } }, { pdf: { equals: file.id } }, { 'audioChapters.file': { equals: file.id } }] },
  })
  const book = books.docs[0]
  if (!book) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const isStaff = user.role !== 'cliente'
  if (!isStaff) {
    const owned = await payload.find({
      collection: 'entitlements',
      overrideAccess: true,
      limit: 1,
      where: { and: [{ user: { equals: user.id } }, { book: { equals: book.id } }] },
    })
    if (!owned.docs.length) return NextResponse.json({ error: 'No tienes este libro' }, { status: 403 })
  }

  const stream = new URL(req.url).searchParams.get('modo') === 'stream'
  const url = await signedUrl(file.filename, { download: !stream, expiresIn: stream ? 3600 : 300 })
  return NextResponse.redirect(url)
}
