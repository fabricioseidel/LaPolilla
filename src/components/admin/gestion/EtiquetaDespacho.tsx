import type { UIFieldServerProps } from 'payload'
import { Button } from '@payloadcms/ui'
import './gestion.css'

/**
 * Campo UI del pedido (sólo se muestra si tiene libros físicos, ver `admin.condition` en Orders).
 * Abre la etiqueta imprimible en una pestaña nueva.
 */
export default function EtiquetaDespacho({ id }: UIFieldServerProps) {
  if (!id) return null
  return (
    <div className="lp-gestion lp-etiqueta-campo field-type" role="group" aria-labelledby="lp-etiqueta-titulo">
      <span id="lp-etiqueta-titulo" className="lp-etiqueta-campo__titulo">
        Despacho de libros físicos
      </span>
      <ol>
        <li>Imprime la etiqueta y pégala en el paquete.</li>
        <li>Lleva el paquete al courier y anota abajo el courier y el n° de seguimiento.</li>
        <li>Cambia el Estado a «Enviado» y guarda: el cliente recibe un email con el seguimiento.</li>
      </ol>
      <Button el="anchor" url={`/api/gestion/pedidos/${id}/etiqueta`} newTab buttonStyle="primary" margin={false}>
        Imprimir etiqueta de despacho<span className="lp-sr"> (se abre en una pestaña nueva)</span>
      </Button>
    </div>
  )
}
