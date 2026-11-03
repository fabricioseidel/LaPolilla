import type { Metadata } from 'next'
import { Fraunces, Inter } from 'next/font/google'
import React from 'react'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { getPayloadClient } from '@/lib/payload'
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl, externalUrl, jsonLd } from '@/lib/seo'
import './styles.css'

const display = Fraunces({ subsets: ['latin'], weight: ['400', '600'], variable: '--font-display', display: 'swap' })
const body = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} · Libros digitales, impresos y audiolibros`, template: '%s · La Polilla' },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  // "./" se resuelve con la ruta de cada página: URL canónica propia y sin parámetros (?volver=…, utm_…).
  alternates: { canonical: './' },
  // La imagen por defecto es opengraph-image.tsx; Next la copia también a Twitter/X.
  // Ojo: si una página define su propio `openGraph`, reemplaza este objeto completo.
  openGraph: { type: 'website', siteName: SITE_NAME, locale: 'es_CL', url: './' },
  twitter: { card: 'summary_large_image' },
}

export const viewport = { themeColor: '#1C1830' }

/** Organización y sitio (schema.org), con las redes de "Configuración del sitio" si están. */
async function structuredData() {
  let social: (string | undefined)[] = []
  let email: string | undefined
  try {
    const payload = await getPayloadClient()
    const s = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
    social = [externalUrl(s.social?.instagram), externalUrl(s.social?.youtube)]
    email = s.contactEmail || undefined
  } catch {
    // sin base de datos se publican igual los datos básicos
  }
  const sameAs = social.filter((u): u is string => Boolean(u?.startsWith('http')))
  const org = `${SITE_URL}/#organizacion`
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': org,
        name: SITE_NAME,
        url: SITE_URL,
        logo: absoluteUrl('/logo.png'),
        description: SITE_DESCRIPTION,
        ...(email && { email }),
        ...(sameAs.length > 0 && { sameAs }),
      },
      { '@type': 'WebSite', '@id': `${SITE_URL}/#sitio`, name: SITE_NAME, url: SITE_URL, inLanguage: 'es-CL', publisher: { '@id': org } },
    ],
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const data = await structuredData()
  return (
    <html lang="es-CL" className={`${display.variable} ${body.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
