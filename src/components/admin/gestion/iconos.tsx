/** Íconos de trazo simple (decorativos: siempre van junto a un texto). */
type P = { size?: number }

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
})

export const IconoLibroNuevo = ({ size = 20 }: P) => (
  <svg {...base(size)}>
    <path d="M4 19.5V5a2 2 0 0 1 2-2h12v14H6a2 2 0 0 0-2 2.5Z" />
    <path d="M6 21h12" />
    <path d="M11 7v6M8 10h6" />
  </svg>
)

export const IconoPaquete = ({ size = 20 }: P) => (
  <svg {...base(size)}>
    <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
    <path d="m3 8 9 5 9-5M12 13v8" />
  </svg>
)

export const IconoAjustes = ({ size = 20 }: P) => (
  <svg {...base(size)}>
    <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
    <circle cx="16" cy="6" r="2" />
    <circle cx="10" cy="12" r="2" />
    <circle cx="18" cy="18" r="2" />
  </svg>
)

export const IconoGuia = ({ size = 20 }: P) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6" />
    <path d="M12 17h0" />
  </svg>
)

export const IconoInicio = ({ size = 20 }: P) => (
  <svg {...base(size)}>
    <path d="M3 11 12 4l9 7" />
    <path d="M5 10v10h14V10" />
  </svg>
)
