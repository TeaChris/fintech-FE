import type { Metadata } from 'next'
import { AuthCard, FadeIn } from '@/features/auth'
import { AccountLockedContent } from '@/features/auth/components/account-locked-content'

export const metadata: Metadata = {
      title: 'Account Locked — BpaY',
      description: 'Your account is temporarily locked due to too many unsuccessful login attempts.',
}

export default function AccountLockedPage() {
      return (
            <FadeIn direction="up" delay={0.04} className="w-full">
                  <AuthCard
                        title="Account locked"
                        className="text-center [&_h3]:text-center"
                  >
                        <AccountLockedContent />
                  </AuthCard>
            </FadeIn>
      )
}
