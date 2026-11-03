import type { ServerProps } from 'payload'
import { Button } from '@payloadcms/ui'
import { hoyChile, nombreMes, puedeVerVentas, rangoMes, urlCSV } from './shared'
import './gestion.css'

/**
 * Formulario de descarga del CSV de ventas (fechas en hora de Chile).
 * Es un formulario GET normal: el navegador descarga el archivo y la página no cambia.
 */
export function ExportarVentas({ idBase = 'lp-csv' }: { idBase?: string }) {
  const hoy = hoyChile()
  const esteMes = rangoMes(0, hoy)
  const mesAnterior = rangoMes(-1, hoy)
  const idAyuda = `${idBase}-ayuda`

  return (
    <div className="lp-exportar">
      <form className="lp-exportar__form" method="get" action="/api/gestion/pedidos.csv" aria-describedby={idAyuda}>
        <div className="lp-campo">
          <label htmlFor={`${idBase}-desde`}>Desde</label>
          <input id={`${idBase}-desde`} type="date" name="desde" defaultValue={esteMes.desde} max={hoy} required />
        </div>
        <div className="lp-campo">
          <label htmlFor={`${idBase}-hasta`}>Hasta</label>
          <input id={`${idBase}-hasta`} type="date" name="hasta" defaultValue={hoy} max={hoy} required />
        </div>
        <Button type="submit" buttonStyle="primary" size="large" margin={false}>
          Descargar CSV
        </Button>
      </form>
      <div className="lp-exportar__atajos">
        <span>Atajos:</span>
        <a className="lp-enlace" href={urlCSV(mesAnterior.desde, mesAnterior.hasta)}>
          Mes anterior ({nombreMes(mesAnterior.desde)})
        </a>
        <a className="lp-enlace" href={urlCSV(esteMes.desde, hoy)}>
          Este mes hasta hoy
        </a>
      </div>
      <p id={idAyuda} className="lp-exportar__ayuda">
        Incluye los pedidos pagados (Pagado, Preparando envío, Enviado y Entregado) con cliente, RUT, productos, montos y
        folio de boleta. Se abre con Excel o Google Sheets.
      </p>
    </div>
  )
}

/** Sobre la lista de Pedidos (sólo administradora y jefa de edición). */
export default function ExportarVentasLista({ user }: ServerProps) {
  if (!puedeVerVentas(user)) return null
  return (
    <details className="lp-gestion lp-desplegable">
      <summary>Exportar ventas para contabilidad y boletas (CSV)</summary>
      <div className="lp-desplegable__cuerpo">
        <ExportarVentas idBase="lp-csv-lista" />
      </div>
    </details>
  )
}
