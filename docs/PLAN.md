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
  - [ ] Supabase: base de datos y bucket privado `polilla`, luego configurar `.env`
  - [ ] Mercado Pago (Checkout Pro) y Lemon Squeezy (crear una variante genérica con precio personalizable), con webhooks a `/api/webhooks/*`
  - [ ] Dominio `.cl` (NIC Chile) y deploy en Vercel
  - [ ] Resend con el dominio verificado
  - [ ] Cargar el primer libro, la autora y las tarifas de envío
  - [ ] Textos legales (términos, retracto según Ley 19.496, privacidad)
- [ ] **2. Identidad visual:** logo, paleta y tipografías (hoy hay un estilo provisorio)
- [ ] **3. Boleta automática:** OpenFactura o Bsale en `src/lib/invoicing.ts`
- [ ] **4. Mejoras:** marca de agua en EPUB/PDF, cotización automática de envíos, cupones, preventas, reseñas, newsletter, feed de Instagram

## Trámites (persona natural)
- **Inicio de actividades en 1ª categoría** en el SII, necesario para vender y emitir boletas.
- Los libros pagan IVA del 19 %: los precios en CLP se ingresan con IVA incluido.
- Ventas internacionales vía Lemon Squeezy: confirmar el tratamiento tributario con un contador.
