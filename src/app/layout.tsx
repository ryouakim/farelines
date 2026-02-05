import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Farelines - Never Overpay for Flights Again',
  description: 'Track your booked flights and get alerted when the same fare type drops in price. Save money on every flight.',
  keywords: 'flight tracking, fare monitoring, price alerts, flight deals, save on flights',
  authors: [{ name: 'Farelines' }],
  openGraph: {
    title: 'Farelines - Never Overpay for Flights Again',
    description: 'Track your booked flights and get alerted when the same fare type drops in price.',
    url: 'https://farelines.com',
    siteName: 'Farelines',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Farelines - Flight Fare Monitoring',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Farelines - Never Overpay for Flights Again',
    description: 'Track your booked flights and get alerted when prices drop.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-542PZMYLGN"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-542PZMYLGN');
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
