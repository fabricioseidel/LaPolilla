import type { ReactNode, SVGProps } from 'react'

/** Íconos de trazo, en la línea de la polilla. Son decorativos: el texto que los acompaña da el nombre. */
type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & { size?: number }

const Svg = ({ size = 24, children, ...props }: IconProps & { children: ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    {children}
  </svg>
)

export const IconTablet = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="2.5" width="14" height="19" rx="2.5" />
    <path d="M8.5 6.5h7M8.5 9.5h7M8.5 12.5h4.5M11 18.5h2" />
  </Svg>
)

export const IconHeadphones = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 15.5V12a8 8 0 0 1 16 0v3.5" />
    <rect x="3" y="14" width="4.5" height="7" rx="1.6" />
    <rect x="16.5" y="14" width="4.5" height="7" rx="1.6" />
  </Svg>
)

export const IconPackage = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" />
    <path d="m3.5 7.5 8.5 4.5 8.5-4.5M12 12v9M7.8 5.2l8.4 4.6" />
  </Svg>
)

export const IconBook = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 5.5c3-1.3 6-1.3 9 .6 3-1.9 6-1.9 9-.6v13c-3-1.3-6-1.3-9 .6-3-1.9-6-1.9-9-.6z" />
    <path d="M12 6.1v13" />
  </Svg>
)

export const IconBag = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 8h14l-1.1 12.2a1 1 0 0 1-1 .8H7.1a1 1 0 0 1-1-.8z" />
    <path d="M9 10.5V7a3 3 0 0 1 6 0v3.5" />
  </Svg>
)

export const IconUser = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20.5c1.4-3.6 4.2-5.5 7.5-5.5s6.1 1.9 7.5 5.5" />
  </Svg>
)

export const IconMenu = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
)

export const IconClose = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
)

export const IconChevron = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
)

export const IconArrow = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
)

export const IconMail = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m3.8 6.5 8.2 6.5 8.2-6.5" />
  </Svg>
)

export const IconInstagram = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
  </Svg>
)

export const IconYoutube = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
    <path d="M10.2 9.3v5.4l4.6-2.7z" fill="currentColor" />
  </Svg>
)

export const IconQuestion = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.8M12 17.2v.1" />
  </Svg>
)
