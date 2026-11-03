/**
 * La polilla de la identidad como SVG para imágenes generadas con next/og
 * (imagen para compartir y logo). Mismos trazos que MothMark en src/components/Logo.tsx.
 */
const PATHS = [
  'M58 45 C40 20, 10 18, 8 38 C6 55, 35 60, 58 52 Z',
  'M62 45 C80 20, 110 18, 112 38 C114 55, 85 60, 62 52 Z',
  'M58 56 C45 62, 25 75, 32 88 C40 96, 55 78, 58 63 Z',
  'M62 56 C75 62, 95 75, 88 88 C80 96, 65 78, 62 63 Z',
  'M60 40 L60 76',
  'M58 36 C54 26, 48 20, 42 17',
  'M62 36 C66 26, 72 20, 78 17',
]

export function MothSvg({ width, color }: { width: number; color: string }) {
  return (
    <svg
      width={width}
      height={(width * 100) / 120}
      viewBox="0 0 120 100"
      fill="none"
      stroke={color}
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
      <circle cx="60" cy="36" r="3" fill={color} />
    </svg>
  )
}
