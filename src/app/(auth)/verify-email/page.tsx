import type { Metadata } from 'next'
import { AuthCard, FadeIn } from '@/features/auth'
import { VerifyEmailContent } from '@/features/auth/components/verify-email-content'

export const metadata: Metadata = {
      title: 'Verify Email — BpaY',
      description: 'Check your inbox to verify your BpaY account.',
}

export default async function VerifyEmailPage({
      searchParams,
}: {
      searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
      const emailParam = (await searchParams).email
      const email = typeof emailParam === 'string' ? emailParam : undefined

      return (
            <FadeIn direction="up" delay={0.04} className="w-full">
                  <AuthCard
                        title="Check your inbox"
                        className="text-center [&_h3]:text-center"
                  >
                        <VerifyEmailContent email={email} />
                  </AuthCard>
            </FadeIn>
      )
}
