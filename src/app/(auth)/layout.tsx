import type { Metadata } from 'next'

import { AuthLayout } from '@/features/auth'

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
      return <AuthLayout>{children}</AuthLayout>
}

