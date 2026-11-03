# Editorial La Polilla — tienda web

Venta de libros **digitales** (global), **físicos** (Chile) y **audiolibros** (incluidos con toda compra), más galería de ilustraciones, autoras y noticias.

**Stack:** Next.js 16 + Payload CMS 3 (panel en `/admin`) · Postgres y Storage en Supabase · Mercado Pago (CLP) · Lemon Squeezy (USD) · Resend · Vercel.

## Cómo funciona una compra
1. El cliente elige **Chile** (Mercado Pago, CLP) u **otro país** (Lemon Squeezy, USD, sólo digital).
2. `POST /api/checkout` recalcula los precios en el servidor, crea el pedido *pendiente* y redirige a la pasarela.
3. El webhook (`/api/webhooks/*`) valida la firma y el monto, y llama a `fulfillOrder`, que marca el pedido como pagado, crea la cuenta si compró como invitado, agrega el libro a **Mi biblioteca** (ebook + audiolibro), descuenta el stock, emite la boleta y envía el email.
4. Las descargas y el audio pasan por `/api/descargas/[id]`, que verifica la compra y entrega una URL firmada que expira.
5. Cuando la editora marca el pedido como **Enviado** con su N° de seguimiento, el cliente recibe un email automático.

## Estructura
```
src/
  access/roles.ts            Roles: admin, editora, autora, cliente
  collections/               Libros, Autoras, Ilustraciones, Noticias, Pedidos, Biblioteca,
                             Imágenes, Archivos públicos/protegidos, Usuarios
  globals/SiteSettings.ts    Lema, redes, tarifas de envío por región
  lib/                       cart, fulfillment, payments/, invoicing, email, storage
  components/                Carrito, reproductor de audio, formularios de cuenta
  app/(frontend)/            Sitio público + api/ (checkout, webhooks, descargas, progreso)
  app/(payload)/             Panel /admin
```

## Desarrollo local
```bash
cp .env.example .env    # mínimo: DATABASE_URL y PAYLOAD_SECRET
npm install
npm run dev             # http://localhost:3000 · panel: /admin
```
Sin `S3_BUCKET` los archivos se guardan en disco local, y sin `RESEND_API_KEY` los emails se muestran en la consola. Después de cambiar colecciones, ejecuta `npm run generate:types`.

Plan y pendientes: [docs/PLAN.md](docs/PLAN.md)
