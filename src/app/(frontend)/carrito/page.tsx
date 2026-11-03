import { CartView } from '@/components/CartView'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Carrito' }

export default async function Carrito() {
  const payload = await getPayloadClient()
  const s = await payload.findGlobal({ slug: 'site-settings' })
  return (
    <section>
      <h1>Carrito</h1>
      <CartView regions={(s.shippingRates ?? []).map(({ region, price }) => ({ region, price }))} />
    </section>
  )
}
