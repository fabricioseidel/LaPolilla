import type { SocialLink } from '@/lib/institucional/site'
import { IconInstagram, IconYoutube } from './Icons'

const ICONS = { instagram: IconInstagram, youtube: IconYoutube }

/** Enlaces a Instagram y YouTube (los que estén configurados en el panel). */
export function SocialLinks({ links, className = 'inst-social' }: { links: SocialLink[]; className?: string }) {
  if (!links.length) return null
  return (
    <ul className={className}>
      {links.map((l) => {
        const Icon = ICONS[l.kind]
        return (
          <li key={l.kind}>
            <a href={l.href} target="_blank" rel="noopener noreferrer">
              <Icon size={20} />
              <span>{l.label}</span>
              <span className="inst-visually-hidden"> (se abre en otra pestaña)</span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}
