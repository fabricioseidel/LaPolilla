import { headers as getHeaders } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { mediaUrl } from '@/lib/format'
import { getPayloadClient } from '@/lib/payload'
import type { Book } from '@/payload-types'

export const metadata = { title: 'Mi biblioteca' }

export default async function Biblioteca() {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) redirect('/cuenta/ingresar')
  const ents = await payload.find({ collection: 'entitlements', where: { user: { equals: user.id } }, depth: 2, user, overrideAccess: false })
  const orders = await payload.find({ collection: 'orders', where: { user: { equals: user.id } }, sort: '-createdAt', user, overrideAccess: false })
  return (
    <section>
      <h1>Mi biblioteca</h1>
      {!ents.docs.length && <p>Aún no tienes libros. <Link href="/libros">Ver catálogo</Link></p>}
      <div className="grid">
        {ents.docs.map((e) => {
          const b = e.book as Book
          return (
            <Link key={e.id} href={`/biblioteca/${b.slug}`} className="book-card">
              <img src={mediaUrl(b.cover, 'card')} alt={b.title} />
              <h3>{b.title}</h3>
            </Link>
          )
        })}
      </div>
      {orders.docs.length > 0 && (
        <>
          <h2>Mis pedidos</h2>
          <ul>
            {orders.docs.map((o) => (
              <li key={o.id}>
                #{o.id} · {o.status} {o.shipment?.trackingCode && `· seguimiento ${o.shipment.carrier} ${o.shipment.trackingCode}`}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
