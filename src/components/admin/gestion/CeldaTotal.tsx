import type { DefaultServerCellComponentProps } from 'payload'
import { dinero } from './shared'

/** Total del pedido en la lista, con el formato de su moneda: $42.960 o US$12,98. */
export default function CeldaTotal({ cellData, rowData }: DefaultServerCellComponentProps) {
  if (typeof cellData !== 'number') return null
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{dinero(cellData, rowData?.currency === 'USD' ? 'USD' : 'CLP')}</span>
}
