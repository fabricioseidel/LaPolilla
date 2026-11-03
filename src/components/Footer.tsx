import Link from 'next/link'
import { getPayloadClient } from '@/lib/payload'

export async function Footer() {
  const payload = await getPayloadClient()
  const s = await payload.findGlobal({ slug: 'site-settings' })
  return (
    <footer className="site-footer">
      <p>Editorial La Polilla · {s.tagline}</p>
      <nav>
        {s.social?.instagram && <a href={s.social.instagram}>Instagram</a>}
        {s.social?.youtube && <a href={s.social.youtube}>YouTube</a>}
        {s.contactEmail && <a href={`mailto:${s.contactEmail}`}>Contacto</a>}
        <Link href="/terminos">Términos y devoluciones</Link>
      </nav>
    </footer>
  )
}
