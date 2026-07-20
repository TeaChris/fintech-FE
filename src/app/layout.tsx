import type { Metadata } from 'next'
import { Geist, Comfortaa } from 'next/font/google'
import { ApiProvider } from '@/api/hooks'
import './globals.css'

const geistSans = Geist({
      variable: '--font-geist-sans',
      subsets: ['latin'],
})

const comfortaa = Comfortaa({
      display: 'swap',
      subsets: ['latin'],
      style: ['normal'],
      adjustFontFallback: true,
      variable: '--font-comfortaa',
      fallback: ['Arial', 'sans-serif'],
      weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
      title: {
            default: 'BpaY — Modern Financial Platform',
            template: '%s — BpaY',
      },
      description:
            'BpaY is a secure financial platform for managing payments, transfers, and accounts with enterprise-grade security.',
}

export default function RootLayout({
      children,
}: Readonly<{
      children: React.ReactNode
}>) {
      return (
            <html
                  lang="en"
                  className={`${geistSans.variable} ${comfortaa.variable} h-full antialiased`}
            >
                  <body className="min-h-full flex flex-col">
                        <ApiProvider>{children}</ApiProvider>
                  </body>
            </html>
      )
}
