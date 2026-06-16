import type { Metadata } from 'next'
import { AuthCard, FadeIn } from '@/features/auth'
import { RecoveryCodeForm } from '@/features/auth/components/recovery-code-form'

export const metadata: Metadata = {
      title: 'Recovery Code — BpaY',
      description: 'Enter one of your 8-digit recovery codes.',
}

export default function RecoveryPage() {
      return (
            <FadeIn direction="up" delay={0.04} className="w-full">
                  <AuthCard
                        title="Recovery code"
                        description="Enter one of your 8-digit recovery codes."
                        className="text-center [&_h3]:text-center [&_p]:text-center"
                  >
                        <RecoveryCodeForm />
                  </AuthCard>
            </FadeIn>
      )
}
