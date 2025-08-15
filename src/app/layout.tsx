import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { DebugChainInfo } from '../components/DebugChainInfo'
import { ChainSwitchHandler } from '../components/ChainSwitchHandler'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
})

export const metadata: Metadata = {
  title: 'Pagent Credits',
  description: 'Next-Generation Credit Experience Powered by Blockchain',
  keywords: 'crypto, credit card, Base, spend permissions, USDC, DeFi, blockchain, smart account',
  authors: [{ name: 'Pagent Team' }],
  openGraph: {
    title: 'Pagent Credits',
    description: 'Next-Generation Credit Experience Powered by Blockchain',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pagent Credits',
    description: 'Next-Generation Credit Experience Powered by Blockchain',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#6B53FF' },
    { media: '(prefers-color-scheme: dark)', color: '#FEA611' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Remove basePath dependency for cleaner deployment
  const prefix = ''
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Pagent Credits" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <link rel="apple-touch-icon" href={prefix ? `${prefix}/pagentmoney_p_logo.png` : "/pagentmoney_p_logo.png"} />
        <link rel="icon" href={prefix ? `${prefix}/pagentmoney_p_logo.png` : "/pagentmoney_p_logo.png"} type="image/png" sizes="any" />
        <link rel="manifest" href={prefix ? `${prefix}/manifest.json` : "/manifest.json"} />
      </head>
      <body className={`${inter.className} ${inter.variable} mini-app-container`} suppressHydrationWarning>
        <Providers>
          {children}
          <ChainSwitchHandler />
        </Providers>
      </body>
    </html>
  )
}
