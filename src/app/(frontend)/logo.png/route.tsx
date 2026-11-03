import { ImageResponse } from 'next/og'
import { MothSvg } from '@/lib/moth'

// Logo cuadrado (512 × 512) con URL fija, /logo.png: lo usa el JSON-LD de la organización
// en el layout. (icon.svg no sirve: dentro de (frontend) Next le agrega un sufijo a la URL.)
export const dynamic = 'force-static'

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1C1830',
          backgroundImage: 'radial-gradient(circle at 50% 45%, rgba(232,176,75,0.2) 0%, rgba(28,24,48,0) 60%)',
        }}
      >
        <MothSvg width={384} color="#E8B04B" />
      </div>
    ),
    { width: 512, height: 512 },
  )
}
