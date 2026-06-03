import type { Metadata } from 'next'

import { AuthLayout } from '@/features'

export const metadata: Metadata = {
      title: 'Authentication — BpaY',
      description:
            'Secure authentication for your BpaY account. Sign in, create an account, or manage your credentials.',
}

/**
 * Shared layout for all auth routes under `(auth)/`.
 *
 * Wraps every auth page with the `AuthLayout` component, providing
 * consistent header, footer, and trust indicators. Individual pages
 * only need to render their `AuthCard` content.
 */
export default function AuthRouteLayout({
      children,
}: Readonly<{
      children: React.ReactNode
}>) {
      return <AuthLayout>{children}</AuthLayout>
}
