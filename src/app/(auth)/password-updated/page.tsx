import type { Metadata } from 'next'
import { FadeIn } from '@/features/auth'
import { Card } from '@/components/ui/card'
import { ActionSuccessContent } from '@/features/auth/components/action-success-content'

export const metadata: Metadata = {
      title: 'Password Updated — BpaY',
      description: 'Your password has been changed successfully.',
}

export default function PasswordUpdatedPage() {
      return (
            <FadeIn direction="up" delay={0.04} className="w-full">
                  <Card className="p-12 border-none bg-transparent sm:bg-card sm:border-solid sm:border-border sm:shadow-[0_1px_3px_0_rgba(0,0,0,0.04),0_6px_24px_-2px_rgba(0,0,0,0.06)] w-full mx-auto sm:max-w-112.5 rounded-2xl">
                        <ActionSuccessContent
                              title="Password updated"
                              description="Your password has been changed successfully."
                              buttonText="Sign in"
                              buttonLink="/sign-in"
                        />
                  </Card>
            </FadeIn>
      )
}
