import type { Order } from '@/payload-types'

/**
 * Boleta electrónica (SII). Requiere inicio de actividades en 1ª categoría
 * como persona natural. Proveedor sugerido: OpenFactura (Haulmer) o Bsale.
 *
 * Nota: los libros pagan IVA 19 % en Chile; los precios CLP se ingresan con IVA incluido.
 * Mientras no haya proveedor configurado, devuelve null y la boleta se emite
 * manualmente en el portal del SII.
 */
export async function issueBoleta(order: Order): Promise<{ folio: string; url: string } | null> {
  if (!process.env.OPENFACTURA_API_KEY) return null
  // TODO: implementar con la API del proveedor elegido usando order.items y order.total
  void order
  return null
}
