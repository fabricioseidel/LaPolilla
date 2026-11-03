# Guía de uso del panel

Esta guía explica, paso a paso, cómo manejar la tienda de **Editorial La Polilla** desde el panel de administración. Está pensada para la autora y la jefa de edición: no necesitas saber nada técnico.

> **Tip:** esta misma guía está dentro del panel, en el menú → **Guía de uso**. Los nombres en **negrita** son los que verás en pantalla.

## 1. Entrar al panel

1. Abre [https://lapolilla.vercel.app/admin](https://lapolilla.vercel.app/admin). Cuando la tienda tenga su dominio propio, será esa dirección terminada en `/admin`.
2. Escribe tu **Correo electrónico** y tu **Contraseña**, y haz clic en **Iniciar sesión**.
3. ¿No recuerdas tu contraseña? Haz clic en **¿Olvidaste tu contraseña?** y sigue el enlace que te llegará por email.

Para moverte por el panel:

- El **menú** está a la izquierda. Si no lo ves (por ejemplo, en el celular), ábrelo con el botón ☰ de arriba a la izquierda.
- **Inicio**, al comienzo del menú, te lleva al **Resumen**. **Guía de uso** está al final del menú.
- Cada sección muestra una lista. Para agregar algo nuevo usa el botón **Crear**, junto al título de la lista.
- Los cambios se guardan sólo cuando haces clic en **Guardar** (arriba a la derecha).
- Tu cuenta está en el ícono de perfil, arriba a la derecha: ahí puedes **Cambiar contraseña** y elegir el **Tema del admin** (claro u oscuro).
- Para salir, usa el ícono **Cerrar sesión**, al final del menú.

## 2. El Resumen (inicio del panel)

Es lo primero que ves al entrar:

- **Accesos rápidos**: Nuevo libro, Pedidos, Configuración del sitio y Guía de uso.
- **Por despachar**: pedidos con libros físicos que esperan envío (estado **Preparando envío**), del más antiguo al más reciente. Cada uno tiene un enlace **Ver pedido**.
- **Ventas · últimos 30 días**: cuántos pedidos pagados hubo y cuánto suman, en pesos (CLP) y en dólares (USD) por separado. Cuentan como venta los pedidos **Pagado**, **Preparando envío**, **Enviado** y **Entregado**.
- **Pendientes de pago**: compras que alguien empezó pero no terminó de pagar. Casi siempre son compras abandonadas: no tienes que hacer nada.
- **Stock de libros físicos**: cuántos ejemplares quedan de cada libro a la venta. Si quedan **10 o menos**, aparece un aviso para reponer stock o pasar a impresión bajo demanda.
- **Exportar ventas para boletas (CSV)**: ver la sección 8.

> La autora ve sólo los accesos rápidos. Las cifras de ventas y la exportación son para la administradora y la jefa de edición.

## 3. Crear la ficha de la autora

Antes de subir un libro, crea la ficha de quien lo escribió (aparece en la página del libro):

1. Menú → **Catálogo** → **Autoras y autores** → **Crear**.
2. Escribe el **Nombre** (obligatorio).
3. **Foto**: haz clic en **Crear** para subir una imagen nueva, o en **Elegir de los existentes** si ya la subiste antes. También puedes arrastrar el archivo al recuadro.
4. Al subir una imagen, el panel te pide un **Texto alternativo**: una descripción breve de la imagen (por ejemplo, «Retrato de la autora frente a una biblioteca»). Sirve a las personas ciegas y ayuda a que Google encuentre el sitio.
5. **Biografía**: escribe o pega el texto. Puedes usar negrita, cursiva y enlaces.
6. **Redes**: haz clic en **Añadir Link** por cada red social. En **Label** escribe el nombre de la red (por ejemplo, Instagram) y en **Url** la dirección completa (https://…).
7. Haz clic en **Guardar**.

El campo **URL (se genera sola)** se completa automáticamente con el nombre: no necesitas tocarlo.

## 4. Subir un libro

Menú → **Catálogo** → **Libros** → **Crear** (o **Nuevo libro** en el Resumen). La ficha tiene tres pestañas y una columna a la derecha. Puedes guardar cuantas veces quieras mientras la completas.

### Pestaña «Información»

- **Título** (obligatorio) y **Subtítulo**.
- **Autoría**: elige la ficha de la autora (puede haber más de una). Si todavía no existe, créala con el botón **+** que está al lado.
- **Portada**: **Crear** → elige o arrastra la imagen → escribe el **Texto alternativo** → **Guardar**. Usa una imagen vertical y nítida (JPG o PNG).
- **Sinopsis**: el texto que presenta el libro.
- **Muestra gratuita (PDF, pública)**: un PDF con las primeras páginas. Cualquier persona puede descargarlo desde la página del libro, así que **nunca subas aquí el libro completo**.
- **Video YouTube (booktrailer o fragmento de audio)**: pega el enlace del video, por ejemplo `https://www.youtube.com/watch?v=…` o `https://youtu.be/…`.
- **ISBN**, **Páginas** y **Fecha de publicación**.
- **Géneros**: escribe un género y presiona Enter; repite para agregar otro.

### Pestaña «Precios y stock»

En **Digital (ebook + audiolibro)**:

- **Disponible en digital**: viene marcado. Desmárcalo sólo si el libro no se vende en digital.
- **Precio Chile (CLP)**: en pesos, sin puntos ni signo (por ejemplo, 6990). Con IVA incluido.
- **Precio internacional (USD)**: en dólares, con punto para los centavos (por ejemplo, 7.99). Es el precio para quienes compran desde fuera de Chile.

En **Físico (sólo envíos en Chile, incluye ebook + audiolibro)**:

- **Disponible en físico**: desmárcalo si el libro es sólo digital.
- **Precio (CLP)**: precio del libro impreso, con IVA incluido. Quien compra el físico también recibe el ebook y el audiolibro. El envío se cobra aparte, según la región (sección 6).
- **Modo de despacho**:
  - **Stock propio**: tienes ejemplares impresos. Escribe cuántos en **Ejemplares en stock**. Se descuentan solos con cada venta y, si llegan a 0, la versión física no se puede comprar.
  - **Impresión bajo demanda**: no hay stock; cada ejemplar se imprime cuando se vende. Úsalo, por ejemplo, cuando se terminen los 100 ejemplares del primer libro.
- **Peso (g) para envío**: peso aproximado del libro, en gramos.

### Pestaña «Archivos y audiolibro»

Estos archivos están **protegidos**: no son públicos y sólo los descargan quienes compraron el libro, desde **Mi biblioteca** en la tienda.

- **EPUB**: **Crear** → elige el archivo `.epub` → en **Tipo** elige **EPUB** → **Guardar**.
- **PDF**: igual que el EPUB, con **Tipo** **PDF**.
- **Capítulos del audiolibro**: haz clic en **Añadir Capítulo** por cada capítulo y completa:
  - **Título**: por ejemplo, «Capítulo 1: La lámpara».
  - **Audio**: **Crear** → elige el archivo MP3 o M4A → **Tipo**: **Audio** → **Guardar**.
  - **Duración (seg)**: opcional, en segundos (12 minutos y 34 segundos = 754).

Los capítulos se escuchan en el orden de la lista. Para cambiar el orden, arrástralos desde los puntitos de la izquierda.

### Columna de la derecha

- **URL (se genera sola)**: la dirección del libro en la tienda, a partir del título.
- **Estado** y **Destacado en inicio**: ver la sección 5.

Al terminar, haz clic en **Guardar**.

## 5. Estados del libro y «Destacado»

| Estado | Qué significa |
| --- | --- |
| **Borrador** | No aparece en la tienda. Úsalo mientras preparas la ficha. |
| **Preventa** | Aparece en la tienda con la etiqueta «Preventa» y ya se puede comprar. |
| **Publicado** | El libro está a la venta normalmente. |

- **Destacado en inicio**: márcalo para que el libro aparezca en la portada de la tienda (se muestran hasta 3 libros destacados).
- Un libro nuevo parte en **Borrador**. Cuando la ficha esté lista, cambia el **Estado** y haz clic en **Guardar**.

> Si pones en **Preventa** un libro físico con **Stock propio**, indica cuántos ejemplares hay: con 0 ejemplares no se puede comprar la versión física. Si todavía no está impreso, usa **Impresión bajo demanda**.

## 6. Configuración del sitio: tarifas de envío y redes

Menú → **Globales** → **Configuración del sitio** (o el acceso rápido del Resumen). Sólo la administradora y la jefa de edición pueden cambiarla.

- **Lema**: la frase que aparece en la portada y al pie de la tienda.
- **Redes**: la dirección completa de **Instagram** y **Youtube** (https://…). Aparecen al pie de la tienda.
- **Email de contacto**: aparece al pie de la tienda y en las etiquetas de despacho.
- **Tarifas de envío (CLP)**: una fila por región. Haz clic en el botón **Añadir…** que está bajo el título y completa:
  - **Región**: tal como quieres que la vea el cliente (por ejemplo, «Región Metropolitana»).
  - **Precio**: en pesos, sin puntos.
- **Permitir retiro en persona**: déjala desmarcada por ahora; el retiro en persona todavía no aparece al comprar.

Haz clic en **Guardar**.

> **Importante:** al comprar un libro físico, el cliente elige su región en esta lista y se le cobra ese precio. Si no hay ninguna tarifa, nadie podrá comprar libros físicos.

## 7. Despachar un pedido con libros físicos

Cuando alguien compra un libro físico y el pago se confirma, el pedido queda en **Preparando envío** y aparece en **Por despachar**, en el Resumen. Para despacharlo:

1. Abre el pedido: en el Resumen, **Ver pedido**; o menú → **Ventas** → **Pedidos**.
2. Revisa los **Productos** y la **Dirección de envío** (nombre, teléfono, calle, comuna, región e indicaciones).
3. Haz clic en **Imprimir etiqueta de despacho**. La etiqueta se abre en una pestaña nueva: elige el tamaño de papel (**Media carta** o **A6**) y haz clic en **Imprimir etiqueta**. Pégala en el paquete.
4. Lleva el paquete al courier.
5. De vuelta en el pedido, en **Despacho**, elige el **Courier** (Starken, Chilexpress, Blue Express, o **Retiro** si lo retiran en persona) y escribe el **N° de seguimiento** que aparece en el comprobante.
6. Arriba, cambia el **Estado** a **Enviado** y haz clic en **Guardar**.
7. Listo: el cliente recibe un email automático con el courier y el n° de seguimiento.
8. Cuando el paquete llegue, puedes cambiar el estado a **Entregado** y guardar (esto no envía email).

> **Ojo:** completa el courier y el n° de seguimiento **antes** de guardar el pedido como Enviado. El email sale una sola vez, en el momento en que lo guardas como Enviado.

Si en la etiqueta ves datos entre corchetes, como [Dirección del remitente], avisa a quien mantiene el sitio para que ponga los datos reales de la editorial.

Otros estados de un pedido:

- **Pendiente de pago**: la compra se inició pero el pago no se ha confirmado. No hay que hacer nada.
- **Pagado**: compra sólo digital. El ebook y el audiolibro ya están en **Mi biblioteca** del cliente. No hay que hacer nada.
- **Cancelado** y **Reembolsado**: se marcan a mano. Si devuelves el dinero (desde Mercado Pago o Lemon Squeezy), marca el pedido como **Reembolsado**.

Para encontrar un pedido, escribe el email del cliente o el número del pedido en el buscador de **Pedidos**. Con **Filtros** puedes ver sólo los de un estado (por ejemplo, Preparando envío).

## 8. Exportar las ventas del mes para emitir boletas

Mientras no haya boleta electrónica automática, las boletas se emiten a mano en el SII. El panel te entrega la lista de ventas en un archivo que se abre con Excel:

1. En el **Resumen**, ve a **Exportar ventas para boletas (CSV)**. También está en **Ventas** → **Pedidos**, en el recuadro **Exportar ventas para contabilidad y boletas (CSV)**.
2. Haz clic en el atajo **Mes anterior** (o **Este mes hasta hoy**), o elige las fechas **Desde** y **Hasta** y haz clic en **Descargar CSV**.
3. Abre el archivo con Excel o Google Sheets. Cada fila es un pedido pagado, con: **Fecha**, **N° pedido**, **Cliente**, **Email**, **RUT** (si el cliente lo registró), **Productos**, **Subtotal**, **Envío**, **Total**, **Moneda**, **Pasarela**, **Estado** y **Folio boleta**.
4. Emite cada boleta en el portal del SII ([sii.cl](https://www.sii.cl)) por el **Total** del pedido, que incluye el envío. Los precios en pesos ya incluyen IVA.
5. Anota el folio en el pedido: abre el pedido → **Boleta electrónica** → **Folio** → **Guardar**. Así, en el próximo archivo verás en la columna **Folio boleta** cuáles ya emitiste.

Para tener en cuenta:

- Las fechas están en hora de Chile y el archivo incluye ambos días (desde y hasta).
- Se incluyen los pedidos **Pagado**, **Preparando envío**, **Enviado** y **Entregado**. Los pendientes, cancelados y reembolsados no aparecen.
- Los montos en dólares vienen con coma decimal (7,99), como los usa Excel en español.
- La sección **Boleta electrónica** sólo aparece en los pedidos en pesos (CLP). Para las ventas en dólares (Lemon Squeezy), confirma con tu contador cómo declararlas.

## 9. Cuentas del equipo y roles

Sólo la **administradora** puede crear cuentas del equipo y asignar roles.

1. Menú → **Cuentas** → **Usuarios** → **Crear**.
2. Completa **Correo electrónico**, **Nueva Contraseña** y **Confirmar Contraseña** (una contraseña provisoria), **Nombre** y **Rol**.
3. Haz clic en **Guardar**.
4. Envía la contraseña provisoria por un medio privado y pide a la persona que la cambie al entrar (ícono de perfil → **Cambiar contraseña**).

| Puede… | Administradora | Jefa de edición | Autora |
| --- | --- | --- | --- |
| Subir y editar libros, autoras, ilustraciones, noticias e imágenes | Sí | Sí | Sí |
| Ver pedidos e imprimir etiquetas de despacho | Sí | Sí | Sí |
| Ver las cifras de ventas y exportar el CSV | Sí | Sí | No |
| Cambiar la Configuración del sitio | Sí | Sí | No |
| Crear cuentas del equipo y cambiar roles | Sí | No | No |
| Borrar pedidos y cuentas | Sí | No | No |

El rol **Cliente** es el de las personas que compran en la tienda: no pueden entrar al panel. Sus cuentas también aparecen en **Usuarios**.

## 10. Ilustraciones y noticias

### Ilustraciones

Menú → **Contenido** → **Ilustraciones** → **Crear**. Completa **Título**, **Imagen** (con su texto alternativo), **Ilustrador/a**, **Libro relacionado** (opcional) y **Descripción**, y haz clic en **Guardar**. Las ilustraciones aparecen en la galería del sitio.

### Noticias

Menú → **Contenido** → **Noticias / Blog** → **Crear**:

1. Escribe el **Título**, elige una **Imagen**, escribe un **Resumen** (se muestra en la lista de noticias) y el **Contenido**.
2. A la derecha, elige la **Fecha** de la noticia.
3. **Guardar borrador** guarda la noticia sin publicarla. **Publicar cambios** la muestra en el sitio.

Si editas una noticia ya publicada, vuelve a hacer clic en **Publicar cambios** para que se vea la nueva versión.

## Preguntas frecuentes

- **No veo el menú.** Haz clic en el botón ☰, arriba a la izquierda.
- **Cambié algo y no se ve en la tienda.** Revisa que hayas hecho clic en **Guardar** (en noticias, **Publicar cambios**) y que el libro no esté en **Borrador**. Luego recarga la página de la tienda.
- **Un cliente no encuentra su libro.** Busca su pedido por email. Si está Pagado, Preparando envío, Enviado o Entregado, el libro ya está en su **Mi biblioteca**: debe entrar a la tienda con el mismo email con que compró.
- **Me equivoqué de estado en un pedido.** Cámbialo y guarda. Recuerda que el email de envío sale sólo la primera vez que el pedido se guarda como Enviado.
