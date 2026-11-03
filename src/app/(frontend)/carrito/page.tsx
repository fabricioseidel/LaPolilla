import { headers as getHeaders } from 'next/headers'
import { CartView } from '@/components/CartView'
import { getPayloadClient } from '@/lib/payload'
import { gateways } from '@/lib/payments/config'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Carrito' }

export default async function Carrito({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const payload = await getPayloadClient()
  const [{ user }, settings, { error }] = await Promise.all([
    payload.auth({ headers: await getHeaders() }),
    payload.findGlobal({ slug: 'site-settings' }),
    searchParams,
  ])
  return (
    <section>
      <h1>Carrito</h1>
      {error === 'pago' && <p className="error">El pago no se completó. Puedes intentarlo de nuevo.</p>}
      <CartView
        userEmail={user?.email ?? null}
        gateways={gateways()}
        regions={(settings.shippingRates ?? []).map(({ region, price }) => ({ region, price }))}
      />
    </section>
  )
}
