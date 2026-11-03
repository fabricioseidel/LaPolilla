import type { ServerProps } from 'payload'
import { Link } from '@payloadcms/ui'
import type { ReactNode } from 'react'
import { IconoGuia, IconoInicio } from './iconos'
import { urlPanel } from './shared'
import './gestion.css'

/** Enlace del menú lateral con el mismo estilo que los de Payload. */
function EnlaceNav({ href, activo, children }: { href: string; activo: boolean; children: ReactNode }) {
  return (
    <Link className="nav__link lp-nav__link" href={href} prefetch={false} aria-current={activo ? 'page' : undefined}>
      {activo && <div className="nav__link-indicator" />}
      <span className="nav__link-label">{children}</span>
    </Link>
  )
}

const segmentos = (params: ServerProps['params']) => {
  const s = params?.segments
  return Array.isArray(s) ? s : s ? [s] : []
}

/** "Inicio" (el Resumen) al comienzo del menú. */
export function NavInicio({ payload, params }: ServerProps) {
  return (
    <div className="lp-gestion lp-nav__grupo">
      <EnlaceNav href={urlPanel(payload, '')} activo={segmentos(params).length === 0}>
        <IconoInicio size={16} />
        Inicio
      </EnlaceNav>
    </div>
  )
}

/** "Guía de uso" al final del menú. */
export function NavGuia({ payload, params }: ServerProps) {
  return (
    <div className="lp-gestion">
      <EnlaceNav href={urlPanel(payload, '/guia')} activo={segmentos(params)[0] === 'guia'}>
        <IconoGuia size={16} />
        Guía de uso
      </EnlaceNav>
    </div>
  )
}
