/** Qué pasarelas están habilitadas, según las variables de entorno configuradas en Vercel. */
export function gateways() {
  return {
    mercadopago: Boolean(process.env.MP_ACCESS_TOKEN),
    lemonsqueezy: Boolean(
      process.env.LEMONSQUEEZY_API_KEY &&
        process.env.LEMONSQUEEZY_STORE_ID &&
        process.env.LEMONSQUEEZY_VARIANT_ID &&
        process.env.LEMONSQUEEZY_WEBHOOK_SECRET,
    ),
  }
}

export type Gateways = ReturnType<typeof gateways>

/** Credenciales de prueba de Mercado Pago (empiezan con TEST-). */
export const isMercadoPagoTest = () => process.env.MP_ACCESS_TOKEN?.startsWith('TEST-') ?? false
