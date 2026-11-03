import React from 'react'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import './styles.css'

export const metadata = {
  title: { default: 'Editorial La Polilla', template: '%s · La Polilla' },
  description: 'Libros digitales, físicos y audiolibros de Editorial La Polilla.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
