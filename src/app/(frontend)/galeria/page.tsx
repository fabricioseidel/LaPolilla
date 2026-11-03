import { mediaUrl } from '@/lib/format'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Ilustraciones' }

export default async function Galeria() {
  const payload = await getPayloadClient()
  const items = await payload.find({ collection: 'illustrations', limit: 100 })
  return (
    <section>
      <h1>Ilustraciones</h1>
      <div className="gallery">
        {items.docs.map((i) => (
          <figure key={i.id}>
            <img src={mediaUrl(i.image, 'card')} alt={i.title} loading="lazy" />
            <figcaption>{i.title}{i.artist && ` · ${i.artist}`}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
