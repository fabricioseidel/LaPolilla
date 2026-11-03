import type { Payload } from 'payload'
import { gateways } from '../payments/config'
import { toLexical, type Block, type Inline } from './richtext'

/**
 * Textos por defecto de las páginas institucionales.
 * Se usan como valor inicial en el panel (Contenido → Textos del sitio) y como respaldo
 * en el sitio cuando un texto está vacío. Los datos por completar van entre corchetes [ ].
 */

export type TextContext = {
  /** Email de contacto de la Configuración del sitio, si existe. */
  contactEmail?: string | null
  /** ¿Están habilitados los pagos internacionales (Lemon Squeezy)? */
  intl: boolean
}

export type FaqItem = { pregunta: string; respuesta: string }

export async function getTextContext(payload: Payload): Promise<TextContext> {
  let contactEmail: string | null | undefined
  try {
    contactEmail = (await payload.findGlobal({ slug: 'site-settings', depth: 0 })).contactEmail
  } catch {
    contactEmail = undefined
  }
  return { contactEmail, intl: gateways().lemonsqueezy }
}

const emailText = (ctx: TextContext) => ctx.contactEmail || '[email de contacto]'
const emailInline = (ctx: TextContext): Inline =>
  ctx.contactEmail ? { a: ctx.contactEmail, href: `mailto:${ctx.contactEmail}` } : '[email de contacto]'

// ---------------------------------------------------------------------------
// Nosotros
// ---------------------------------------------------------------------------

export const nosotrosTemplate = (): Block[] => [
  { h2: 'Una editorial pequeña, hecha con tiempo' },
  {
    p: 'Editorial La Polilla nació en [año de fundación], en [ciudad], con una idea sencilla: hacer libros con calma y con cuidado, y que lleguen a sus lectoras y lectores estén donde estén.',
  },
  {
    p: 'Somos una editorial chilena pequeña. Elegimos cada texto con atención, lo editamos con paciencia y lo acompañamos en todo su recorrido: desde el manuscrito hasta tus manos, tu pantalla o tus audífonos.',
  },
  { h2: '¿Por qué una polilla?' },
  {
    p: 'Porque las polillas vuelan hacia la luz, igual que quienes leemos de noche bajo una lámpara. Así pensamos nuestros libros: como una luz encendida que invita a acercarse.',
  },
  { h2: 'Un libro, tres maneras de leerlo' },
  {
    p: 'Publicamos cada libro en digital (EPUB y PDF), en audiolibro y en papel. El audiolibro viene incluido con cualquier compra, y quien compra el libro impreso recibe también el ebook.',
  },
  {
    p: 'Imprimimos tiradas pequeñas y, cuando se agotan, imprimimos bajo demanda. Así nuestros libros siguen disponibles sin acumular ejemplares en una bodega.',
  },
  { h2: 'Quiénes hacemos La Polilla' },
  {
    ul: [
      [{ b: '[Nombre de la autora]' }, ' — autora. [Una o dos líneas sobre ella y su escritura.]'],
      [{ b: '[Nombre de la jefa de edición]' }, ' — jefa de edición. [Una o dos líneas sobre ella y su trabajo.]'],
    ],
  },
  { h2: 'Conversemos' },
  {
    p: [
      '¿Quieres invitarnos a una feria, a una presentación o a tu club de lectura? ¿Tienes una pregunta sobre alguno de nuestros libros? ',
      { a: 'Escríbenos', href: '/contacto' },
      ' y te responderemos con gusto.',
    ],
  },
]

// ---------------------------------------------------------------------------
// Términos y condiciones (Ley 19.496)
// ---------------------------------------------------------------------------

export const terminosTemplate = (ctx: TextContext): Block[] => [
  {
    p: 'Estos términos regulan las compras que hagas en el sitio de Editorial La Polilla. Te pedimos leerlos antes de comprar; puedes guardarlos o imprimirlos cuando quieras.',
  },
  { p: { i: 'Última actualización: [fecha].' } },

  { h2: 'Quiénes somos' },
  {
    p: [
      'Editorial La Polilla es el nombre comercial de [nombre completo o razón social], RUT [RUT], con domicilio en [domicilio], Chile (en adelante, «La Polilla»). Puedes escribirnos a ',
      emailInline(ctx),
      ' o desde la ',
      { a: 'página de contacto', href: '/contacto' },
      '.',
    ],
  },

  { h2: 'Tu cuenta' },
  {
    p: 'Para comprar necesitas una cuenta con tu email y una contraseña. Así, cada libro que compras queda guardado en Mi biblioteca. Eres responsable de mantener tu contraseña en reserva y de que los datos que nos entregas sean correctos.',
  },

  { h2: 'Productos y formatos' },
  {
    ul: [
      [{ b: 'Libro digital:' }, ' ebook en formatos EPUB y PDF. Se puede comprar desde cualquier país.'],
      [{ b: 'Audiolibro:' }, ' viene incluido con cualquier compra, digital o física, y se escucha en línea desde Mi biblioteca.'],
      [{ b: 'Libro físico:' }, ' ejemplar impreso, con envío sólo dentro de Chile. Incluye además el ebook y el audiolibro.'],
    ],
  },
  {
    p: 'Algunos libros se imprimen bajo demanda una vez agotado su stock. En ese caso, el plazo de preparación es de [plazo de impresión bajo demanda].',
  },

  { h2: 'Precios y pagos' },
  {
    ul: [
      'Los precios en pesos chilenos incluyen IVA. El costo de envío de los libros físicos depende de la región de destino y se suma al total antes de pagar.',
      'Las compras desde Chile se pagan en pesos chilenos a través de Mercado Pago.',
      'Las compras desde otros países (sólo libros digitales) se pagan en dólares a través de Lemon Squeezy, que procesa el pago y puede agregar los impuestos que correspondan a tu país.',
      'La compra se confirma cuando la plataforma de pago aprueba el pago, y te enviamos la confirmación por email. Nunca tenemos acceso a los datos de tu tarjeta.',
      'Respetamos el precio vigente al momento de tu compra, aunque después cambie.',
    ],
  },

  { h2: 'Entrega de libros digitales y audiolibros' },
  {
    p: 'Apenas se confirma el pago, el ebook y el audiolibro quedan disponibles en Mi biblioteca. Desde ahí puedes descargar el EPUB y el PDF, y escuchar el audiolibro cuando quieras.',
  },
  {
    p: 'Los archivos son para tu uso personal: no está permitido copiarlos, compartirlos, revenderlos ni publicarlos, en todo o en parte.',
  },

  { h2: 'Envíos' },
  {
    ul: [
      'Enviamos libros físicos sólo dentro de Chile, a través de [empresa de envíos].',
      'Preparamos tu pedido en [plazo de preparación] días hábiles desde la confirmación del pago. La entrega demora [plazo de entrega] días hábiles, según la región.',
      'Cuando despachemos tu pedido, te enviaremos por email el número de seguimiento.',
      'Si el pedido no se puede entregar por un error en la dirección informada, [indica cómo se resuelve y quién asume el costo del reenvío].',
    ],
  },

  { h2: 'Derecho a retracto' },
  {
    p: 'De acuerdo con la Ley N° 19.496 sobre Protección de los Derechos de los Consumidores, en las compras a distancia puedes retractarte dentro de 10 días, sin expresar causa, en los términos que se indican a continuación.',
  },
  {
    ul: [
      [
        { b: 'Libros físicos:' },
        ' tienes 10 días desde que recibes el libro para retractarte. El libro debe estar sin uso, completo y en el mismo estado en que lo recibiste. Escríbenos a ',
        emailInline(ctx),
        ' con tu número de pedido y te indicaremos cómo devolverlo. [Indica quién paga el envío de la devolución.] Te reembolsaremos lo pagado dentro de [plazo de reembolso] desde que recibamos el libro.',
      ],
      [
        { b: 'Libros digitales y audiolibros:' },
        ' se entregan de inmediato. Por eso, una vez que descargas el ebook (EPUB o PDF) o comienzas a escuchar el audiolibro, ya no es posible retractarse de esa compra. Si todavía no has descargado ni escuchado nada, puedes retractarte dentro de 10 días desde la compra.',
      ],
    ],
  },
  {
    p: '[Revisar con asesoría legal: cómo se aplica el retracto de un libro físico cuando ya se descargó el ebook o se escuchó el audiolibro incluidos.]',
  },

  { h2: 'Garantía legal' },
  {
    p: 'Si tu libro físico llega dañado o con fallas de fabricación (por ejemplo, páginas en blanco, mal impresas o mal encuadernadas), tienes derecho a elegir entre la reparación, el cambio o la devolución de lo pagado dentro de los 6 meses siguientes a su recepción, según la Ley N° 19.496. Escríbenos con una foto del problema y tu número de pedido.',
  },
  {
    p: 'Si un archivo digital no abre o tiene errores, escríbenos: te enviaremos una versión corregida o, si no es posible, te devolveremos lo pagado.',
  },

  { h2: 'Propiedad intelectual' },
  {
    p: 'Los textos, ilustraciones, audios, diseños y marcas de este sitio y de nuestros libros están protegidos por la Ley N° 17.336 sobre Propiedad Intelectual, y pertenecen a La Polilla o a sus autoras, autores e ilustradores. Comprar un libro no transfiere esos derechos.',
  },

  { h2: 'Datos personales' },
  { p: ['Tratamos tus datos según nuestra ', { a: 'Política de privacidad', href: '/privacidad' }, '.'] },

  { h2: 'Cambios a estos términos' },
  {
    p: 'Podemos actualizar estos términos. Cada compra se rige por la versión vigente al momento de hacerla, y en esta página siempre encontrarás la versión actual.',
  },

  { h2: 'Ley aplicable y reclamos' },
  {
    p: [
      'Estos términos se rigen por las leyes de Chile. Si tienes un problema con tu compra, escríbenos primero: queremos resolverlo. También puedes presentar un reclamo ante el ',
      { a: 'Servicio Nacional del Consumidor (SERNAC)', href: 'https://www.sernac.cl' },
      ' o ante el juzgado de policía local que corresponda.',
    ],
  },

  { h2: 'Contacto' },
  {
    p: [
      'Para cualquier consulta sobre estos términos, escríbenos a ',
      emailInline(ctx),
      ' o desde la ',
      { a: 'página de contacto', href: '/contacto' },
      '.',
    ],
  },
]

// ---------------------------------------------------------------------------
// Política de privacidad (Ley 19.628)
// ---------------------------------------------------------------------------

export const privacidadTemplate = (ctx: TextContext): Block[] => [
  {
    p: 'En Editorial La Polilla cuidamos tus datos personales. Aquí te contamos qué datos recopilamos, para qué los usamos y cuáles son tus derechos, de acuerdo con la Ley N° 19.628 sobre Protección de la Vida Privada.',
  },
  { p: { i: 'Última actualización: [fecha].' } },

  { h2: 'Responsable de tus datos' },
  {
    p: [
      'El responsable es [nombre completo o razón social], RUT [RUT], con domicilio en [domicilio], Chile, quien opera Editorial La Polilla. Contacto: ',
      emailInline(ctx),
      '.',
    ],
  },

  { h2: 'Qué datos recopilamos' },
  {
    ul: [
      [{ b: 'Cuenta:' }, ' nombre, email y contraseña (que guardamos cifrada). De forma opcional, teléfono y RUT para la boleta.'],
      [
        { b: 'Compras:' },
        ' libros comprados, montos, fechas y estado de cada pedido. Si compras un libro físico, además, nombre, teléfono y dirección de envío.',
      ],
      [
        { b: 'Mi biblioteca:' },
        ' los libros a los que tienes acceso y el punto en que dejaste cada audiolibro, para que puedas seguir donde quedaste.',
      ],
      [{ b: 'Contacto:' }, ' nombre, email y el mensaje que nos envías desde el formulario.'],
      [{ b: 'Boletín:' }, ' tu email, si decides inscribirte.'],
    ],
  },
  {
    p: 'No guardamos los datos de tu tarjeta ni de tu medio de pago: los pagos los procesan directamente Mercado Pago y Lemon Squeezy.',
  },

  { h2: 'Para qué los usamos' },
  {
    ul: [
      'Crear y administrar tu cuenta.',
      'Procesar tus compras, darte acceso a tus libros en Mi biblioteca y enviarte los libros físicos.',
      'Emitir la boleta y cumplir nuestras obligaciones legales y tributarias.',
      'Responder tus mensajes y consultas.',
      'Enviarte el boletín, sólo si te inscribiste.',
    ],
  },
  { p: 'No vendemos ni arrendamos tus datos, y no los usamos para fines distintos de los que se describen aquí.' },

  { h2: 'Con quién los compartimos' },
  { p: 'Sólo con los proveedores que necesitamos para operar el sitio, y únicamente con los datos necesarios para cada tarea:' },
  {
    ul: [
      'Mercado Pago y Lemon Squeezy, para procesar los pagos.',
      '[Empresa de envíos], para despachar los libros físicos.',
      '[Proveedor de boleta electrónica], para emitir la boleta.',
      'Vercel, Supabase y Resend, que alojan el sitio, guardan la información y envían los correos. Estos servicios pueden almacenar datos fuera de Chile.',
    ],
  },
  { p: 'También podremos entregar datos cuando lo exija la ley o una autoridad competente.' },

  { h2: 'Cookies y almacenamiento local' },
  {
    p: 'Usamos una cookie necesaria para mantener tu sesión iniciada y el almacenamiento de tu navegador para recordar tu carrito. No usamos cookies publicitarias. Si reproduces un video de YouTube dentro del sitio, YouTube puede aplicar sus propias cookies.',
  },

  { h2: 'Cuánto tiempo guardamos tus datos' },
  {
    p: 'Mientras tengas tu cuenta activa. Los datos de las compras se conservan durante el plazo que exigen las normas tributarias ([plazo legal]). Los mensajes de contacto se guardan por [plazo], y tu email del boletín, hasta que te des de baja.',
  },

  { h2: 'Tus derechos' },
  {
    p: [
      'Puedes pedirnos en cualquier momento acceder a tus datos, corregirlos, eliminarlos u oponerte a su uso, además de los otros derechos que te reconoce la ley. Escríbenos a ',
      emailInline(ctx),
      ' desde el email de tu cuenta y te responderemos dentro de los plazos legales.',
    ],
  },
  { p: 'Puedes darte de baja del boletín cuando quieras, respondiendo a cualquiera de sus correos o escribiéndonos.' },

  { h2: 'Seguridad' },
  {
    p: 'Usamos conexiones cifradas (HTTPS), guardamos las contraseñas cifradas y limitamos el acceso a los datos al equipo de la editorial. Si detectamos un problema de seguridad que te afecte, te avisaremos.',
  },

  { h2: 'Menores de edad' },
  { p: 'Para comprar debes ser mayor de edad o contar con la autorización de tu madre, padre o tutor.' },

  { h2: 'Cambios a esta política' },
  { p: 'Si cambiamos esta política, publicaremos la nueva versión en esta página, con su fecha de actualización.' },

  { h2: 'Contacto' },
  {
    p: [
      'Si tienes preguntas sobre tus datos, escríbenos a ',
      emailInline(ctx),
      ' o desde la ',
      { a: 'página de contacto', href: '/contacto' },
      '.',
    ],
  },
]

// ---------------------------------------------------------------------------
// Preguntas frecuentes (describen el funcionamiento real de la tienda)
// ---------------------------------------------------------------------------

export const defaultFaq = (ctx: TextContext): FaqItem[] => [
  {
    pregunta: '¿Cómo compro un libro?',
    respuesta:
      'Elige el libro y el formato que prefieras (digital o físico) y agrégalo al carrito. Para pagar necesitas una cuenta: así tus libros quedan guardados en Mi biblioteca. Si aún no tienes una, la creas en un minuto con tu email.\n\nLuego eliges desde dónde compras: Chile (en pesos chilenos, con Mercado Pago) u otro país (en dólares, sólo libros digitales). Cuando se confirma el pago, te llega un email y el libro aparece en Mi biblioteca.',
  },
  {
    pregunta: '¿En qué formatos vienen los libros?',
    respuesta:
      'Puedes comprar cada libro en digital o en papel:\n\n• Digital: el ebook en EPUB y en PDF, más el audiolibro.\n• Físico: el libro impreso, más el ebook y el audiolibro.\n\nEl EPUB se adapta a cualquier pantalla y funciona en la mayoría de las aplicaciones y lectores de libros electrónicos (Apple Books, Google Play Libros, Kobo y Kindle, usando «Enviar a Kindle»). El PDF conserva el diseño del libro impreso.',
  },
  {
    pregunta: '¿Cómo descargo mi libro digital?',
    respuesta:
      'Ingresa con tu cuenta y entra a Mi biblioteca. Elige el libro y toca EPUB o PDF para descargarlo. Puedes volver a descargarlo cuando quieras, desde cualquier dispositivo en el que ingreses con tu cuenta.',
  },
  {
    pregunta: '¿Cómo escucho el audiolibro?',
    respuesta:
      'En Mi biblioteca, entra al libro: ahí está el reproductor con todos los capítulos. Se escucha en línea desde el navegador del celular o del computador, sin instalar nada, y recuerda el punto en que quedaste para que sigas escuchando después.',
  },
  {
    pregunta: '¿A dónde envían los libros físicos y cuánto demoran?',
    respuesta:
      'Enviamos libros impresos a todo Chile. El costo de envío depende de la región y se suma al total antes de pagar. Preparamos tu pedido en [plazo de preparación] y la entrega demora [plazo de entrega], según la región.\n\nCuando despachemos tu libro, te enviaremos por email el número de seguimiento. Algunos libros se imprimen bajo demanda y pueden tardar un poco más en estar listos.',
  },
  {
    pregunta: '¿Puedo comprar desde fuera de Chile?',
    respuesta: ctx.intl
      ? 'Sí. Los libros digitales (ebook y audiolibro) se venden a todo el mundo: al pagar, elige «Otro país» y paga en dólares con tarjeta o PayPal. Los libros físicos, por ahora, sólo se envían dentro de Chile.'
      : `Los libros digitales (ebook y audiolibro) se pueden comprar desde cualquier país, pagando en dólares. Si quieres comprar desde el extranjero y todavía no ves esa opción al pagar, escríbenos a ${emailText(ctx)}. Los libros físicos, por ahora, sólo se envían dentro de Chile.`,
  },
  {
    pregunta: '¿Puedo devolver un libro? (derecho a retracto)',
    respuesta:
      'Sí. Según la Ley del Consumidor, tienes 10 días desde que recibes un libro físico para retractarte de la compra; el libro debe estar en el mismo estado en que llegó. En los libros digitales y audiolibros, el retracto procede sólo si aún no has descargado ni escuchado el contenido.\n\nSi tu libro llegó dañado o un archivo tiene problemas, escríbenos y lo solucionamos. Encontrarás todos los detalles en los Términos y condiciones.',
  },
  {
    pregunta: '¿Me entregan boleta?',
    respuesta:
      'Sí. Por las compras en pesos chilenos emitimos boleta electrónica y te la enviamos por email. Si pagas en dólares desde otro país, el comprobante de pago te lo envía la plataforma que procesa el pago.',
  },
  {
    pregunta: '¿Cómo me comunico con ustedes?',
    respuesta: `Escríbenos desde la página de Contacto o directamente a ${emailText(ctx)}. Te responderemos lo antes posible.`,
  },
]

// ---------------------------------------------------------------------------
// Atajos para el panel y las páginas
// ---------------------------------------------------------------------------

export const defaultNosotros = () => toLexical(nosotrosTemplate())
export const defaultTerminos = (ctx: TextContext) => toLexical(terminosTemplate(ctx))
export const defaultPrivacidad = (ctx: TextContext) => toLexical(privacidadTemplate(ctx))
