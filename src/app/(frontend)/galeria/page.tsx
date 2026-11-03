import Link from 'next/link'
import '../styles/catalogo.css'
import { galeriaItem } from '@/components/catalogo/galeria'
import { GaleriaGrid, type GaleriaItem } from '@/components/catalogo/GaleriaGrid'
import { MothMark } from '@/components/Logo'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Ilustraciones',
  description: 'Galería de ilustraciones de los libros de Editorial La Polilla.',
}

export default async function Galeria() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({ collection: 'illustrations', sort: '-createdAt', pagination: false, depth: 1 })
  const items = docs.map(galeriaItem).filter((i): i is GaleriaItem => i !== null)

  return (
    <section>
      <header className="cat-encabezado">
        <p className="cat-eyebrow">Galería</p>
        <h1>Ilustraciones</h1>
        <p>Las imágenes que acompañan nuestros libros: bocetos, portadas e ilustraciones interiores. Toca una para verla en grande.</p>
      </header>

      {items.length === 0 ? (
        <div className="cat-vacio">
          <MothMark size={88} color="var(--gold)" />
          <h2>La galería está por abrir</h2>
          <p>Pronto vas a encontrar aquí las ilustraciones de nuestros libros.</p>
          <div className="cat-vacio-acciones">
            <Link className="btn" href="/libros">
              Ver libros
            </Link>
          </div>
        </div>
      ) : (
        <GaleriaGrid items={items} />
      )}
    </section>
  )
}
