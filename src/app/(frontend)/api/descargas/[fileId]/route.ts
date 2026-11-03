import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { headers as getHeaders } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Payload } from 'payload'
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

  // Desarrollo local (sin S3): el archivo está en el disco de Payload.
  if (!process.env.S3_BUCKET) return serveLocalFile(req, payload, { filename: file.filename, mimeType: file.mimeType }, stream)

  const url = await signedUrl(file.filename, { download: !stream, expiresIn: stream ? 3600 : 300 })
  return NextResponse.redirect(url)
}

/**
 * Transmite un archivo protegido desde el staticDir local de la colección,
 * con soporte de Range (el reproductor pide el audio por partes para avanzar y retroceder).
 * Sólo se usa cuando S3_BUCKET está vacío; en producción se redirige a la URL firmada de S3.
 */
async function serveLocalFile(req: Request, payload: Payload, file: { filename: string; mimeType?: string | null }, inline: boolean) {
  const upload = payload.collections['protected-files']?.config.upload
  const dir = path.resolve((typeof upload === 'object' && upload.staticDir) || 'protected-files')
  const filePath = path.resolve(dir, file.filename)
  if (!filePath.startsWith(dir + path.sep)) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  const info = await stat(filePath).catch(() => null)
  if (!info?.isFile()) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const size = info.size
  const asciiName = file.filename.replace(/[^\x20-\x7e]|["\\]/g, '_')
  const headers = new Headers({
    'Content-Type': file.mimeType || 'application/octet-stream',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
  })

  const range = parseRange(req.headers.get('range'), size)
  if (range === 'invalid') {
    headers.set('Content-Range', `bytes */${size}`)
    return new Response(null, { status: 416, headers })
  }
  const { start, end } = range ?? { start: 0, end: size - 1 }
  headers.set('Content-Length', String(size ? end - start + 1 : 0))
  if (range) headers.set('Content-Range', `bytes ${start}-${end}/${size}`)

  if (!size) return new Response(null, { status: 200, headers })
  // Stream con contrapresión; si el navegador corta la petición (p. ej. al saltar en el audio), se cierra el archivo.
  const chunks = createReadStream(filePath, { start, end })[Symbol.asyncIterator]()
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { value, done } = await chunks.next()
      if (done) controller.close()
      else controller.enqueue(new Uint8Array(value as Buffer))
    },
    async cancel() {
      await chunks.return?.()
    },
  })
  return new Response(body, { status: range ? 206 : 200, headers })
}

/** Un solo rango "bytes=inicio-fin" (también "inicio-" y "-sufijo"). Otros formatos se ignoran y se entrega todo. */
function parseRange(header: string | null, size: number): { start: number; end: number } | 'invalid' | null {
  const m = header ? /^bytes=(\d*)-(\d*)$/.exec(header.trim()) : null
  if (!m || (m[1] === '' && m[2] === '')) return null
  let start: number
  let end: number
  if (m[1] === '') {
    const suffix = Number(m[2])
    if (!suffix) return 'invalid'
    start = Math.max(0, size - suffix)
    end = size - 1
  } else {
    start = Number(m[1])
    end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1)
  }
  if (start >= size || start > end) return 'invalid'
  return { start, end }
}
