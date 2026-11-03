import { Fraunces, Inter } from 'next/font/google'
import React from 'react'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import './styles.css'

const display = Fraunces({ subsets: ['latin'], weight: ['400', '600'], variable: '--font-display', display: 'swap' })
const body = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body', display: 'swap' })

export const metadata = {
  title: { default: 'Editorial La Polilla', template: '%s · La Polilla' },
  description: 'Libros digitales, físicos y audiolibros de Editorial La Polilla.',
}

export const viewport = { themeColor: '#1C1830' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable}`}>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
