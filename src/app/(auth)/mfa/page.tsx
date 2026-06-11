import type { Metadata } from 'next'
import { AuthCard, FadeIn } from '@/features/auth'
import { MfaVerificationForm } from '@/features/auth/components/mfa-verification-form'

export const metadata: Metadata = {
      title: 'Verify Your Identity — BpaY',
      description: 'Enter the 6-digit code from your authenticator app.',
}

export default function MfaPage() {
      return (
            <FadeIn direction="up" delay={0.04} className="w-full">
                  <AuthCard
                        title="Verify your identity"
                        description="Enter the 6-digit code from your authenticator app."
                        className="text-center [&_h3]:text-center [&_p]:text-center"
                  >
                        <MfaVerificationForm />
                  </AuthCard>
            </FadeIn>
      )
}
