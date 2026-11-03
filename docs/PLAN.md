# Plan del proyecto

## Decisiones
| Tema | Decisión |
|---|---|
| Venta física | Sólo Chile. 100 ejemplares en stock del primer libro y luego impresión bajo demanda (`fulfillment: pod`) |
| Venta digital | Global |
| Pagos Chile | Mercado Pago, CLP |
| Pagos internacionales | Lemon Squeezy, USD (merchant of record: cobra y declara el IVA/VAT; acepta tarjetas y PayPal) |
| Audiolibro | Incluido con cualquier compra (digital o física), junto con el ebook |
| Contenido | Lo suben la autora y la jefa de edición desde `/admin` |
| Facturación | Persona natural: boleta electrónica SII |

## Fases
- [x] **0. Estructura:** colecciones, pagos, biblioteca, descargas protegidas y reproductor
- [ ] **1. Puesta en marcha (MVP)**
  - [x] Supabase: proyecto `la-polilla` (sa-east-1), esquema `payload` con rol dedicado, bucket privado `polilla`
  - [x] Vercel: proyecto `lapolilla` (región gru1) conectado a GitHub, https://lapolilla.vercel.app
  - [x] Código en GitHub (fabricioseidel/LaPolilla)
  - [ ] Crear llaves S3 en Supabase y cargarlas en Vercel (`S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`)
  - [x] Flujo de pago robusto: compra con cuenta, webhooks verificados contra la API de la pasarela, pedidos procesados una sola vez aunque lleguen notificaciones duplicadas
  - [ ] Mercado Pago (Chile): credenciales de prueba → compra de prueba → credenciales de producción. Webhook: `/api/webhooks/mercadopago`
  - [ ] Internacional (USD): Lemon Squeezy admite pagos a bancos de Chile, pero Stripe lo está migrando a "Managed Payments", que hoy no acepta negocios en Chile. Evaluar al registrarse; alternativa: PayPal. Webhook: `/api/webhooks/lemonsqueezy`
  - [ ] Dominio `.cl` (NIC Chile) y deploy en Vercel
  - [ ] Emails (confirmación, despacho, recuperar contraseña): Resend con el dominio `.cl` verificado
  - [ ] Cargar el primer libro, la autora y las tarifas de envío
  - [ ] Textos legales (términos, retracto según Ley 19.496, privacidad)
- [x] **2. Identidad visual "Nocturna":** noche #1C1830, índigo #2A2347, lila #9C86C9, lámpara #E8B04B, papel luna #F3EEF9 · Fraunces (títulos) + Inter (textos) · polilla de trazo dorado
- [ ] **3. Boleta automática:** OpenFactura o Bsale en `src/lib/invoicing.ts`
- [ ] **4. Mejoras:** marca de agua en EPUB/PDF, cotización automática de envíos, cupones, preventas, reseñas, newsletter, feed de Instagram

## Trámites (persona natural)
- **Inicio de actividades en 1ª categoría** en el SII, necesario para vender y emitir boletas.
- Los libros pagan IVA del 19 %: los precios en CLP se ingresan con IVA incluido.
- Ventas internacionales vía Lemon Squeezy: confirmar el tratamiento tributario con un contador.
