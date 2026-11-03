/** Polilla de la identidad "Nocturna". `variant="line"` = trazo dorado; `"solid"` = relleno. */
export function MothMark({ size = 40, variant = 'line', color = 'currentColor', title }: {
  size?: number
  variant?: 'line' | 'solid'
  color?: string
  title?: string
}) {
  const wings = (
    <>
      <path d="M58 45 C40 20, 10 18, 8 38 C6 55, 35 60, 58 52 Z" />
      <path d="M62 45 C80 20, 110 18, 112 38 C114 55, 85 60, 62 52 Z" />
      <path d="M58 56 C45 62, 25 75, 32 88 C40 96, 55 78, 58 63 Z" />
      <path d="M62 56 C75 62, 95 75, 88 88 C80 96, 65 78, 62 63 Z" />
    </>
  )
  const a11y = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true as const }
  if (variant === 'solid')
    return (
      <svg width={size} height={size * (100 / 120)} viewBox="0 0 120 100" fill={color} {...a11y}>
        {wings}
      </svg>
    )
  return (
    <svg
      width={size}
      height={size * (100 / 120)}
      viewBox="0 0 120 100"
      fill="none"
      stroke={color}
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...a11y}
    >
      {wings}
      <path d="M60 40 L60 76" />
      <path d="M58 36 C54 26, 48 20, 42 17" />
      <path d="M62 36 C66 26, 72 20, 78 17" />
      <circle cx="60" cy="36" r="3" fill={color} />
    </svg>
  )
}

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <span className="logo-lockup">
      <MothMark size={size} color="var(--gold)" />
      <span className="logo-text">
        <span className="logo-name">La Polilla</span>
        <span className="logo-sub">Editorial</span>
      </span>
    </span>
  )
}
