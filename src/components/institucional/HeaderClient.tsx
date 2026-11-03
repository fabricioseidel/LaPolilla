'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react'
import { IconClose, IconMenu } from './Icons'

/** ¿El enlace corresponde a la página actual (o a una de sus subpáginas)? */
const isCurrent = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

/** Enlace de navegación que se marca con aria-current cuando estás en esa sección. */
export function NavLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const pathname = usePathname() ?? ''
  const current = isCurrent(pathname, href)
  return (
    <Link href={href} className={className} aria-current={current ? 'page' : undefined}>
      {children}
    </Link>
  )
}

/**
 * «Saltar al contenido»: lleva el foco al contenido principal sin recorrer toda la navegación.
 * Busca #contenido y, si no existe, el primer <main>.
 */
export function SkipLink() {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById('contenido') ?? document.querySelector('main')
    if (!target) return
    e.preventDefault()
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
    target.focus()
    target.scrollIntoView()
  }
  return (
    <a href="#contenido" className="inst-skip" onClick={onClick}>
      Saltar al contenido
    </a>
  )
}

/**
 * Menú desplegable para celulares, con <details>: funciona aun sin JavaScript.
 * Con JavaScript, además se cierra al navegar, al tocar fuera o con la tecla Escape.
 */
export function MobileMenu({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    if (ref.current) ref.current.open = false
  }, [pathname])

  useEffect(() => {
    const close = (focusSummary: boolean) => {
      const el = ref.current
      if (!el?.open) return
      el.open = false
      if (focusSummary) el.querySelector('summary')?.focus()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close(true)
    const onClick = (e: globalThis.MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('click', onClick)
    }
  }, [])

  return (
    <details ref={ref} className="masthead-menu">
      <summary>
        <span className="masthead-menu-open">
          <IconMenu />
        </span>
        <span className="masthead-menu-close">
          <IconClose />
        </span>
        Menú
      </summary>
      {/* Al elegir un enlace (aunque sea la página actual) el menú se cierra. */}
      <div
        className="masthead-menu-panel"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('a') && ref.current) ref.current.open = false
        }}
      >
        {children}
      </div>
    </details>
  )
}
