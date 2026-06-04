import type { Metadata } from 'next'
import { Comfortaa } from 'next/font/google'

import { AuthLayout } from '@/features/auth'

const comfortaa = Comfortaa({
      variable: '--font-comfortaa',
      subsets: ['latin'],
      weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
      title: 'Authentication — BpaY',
      description:
            'Secure authentication for your BpaY account. Sign in, create an account, or manage your credentials.',
}

export default function AuthRouteLayout({
      children,
}: Readonly<{
      children: React.ReactNode
}>) {
      return (
            <div className={`${comfortaa.variable}`}>
                  <AuthLayout>{children}</AuthLayout>
            </div>
      )
}
