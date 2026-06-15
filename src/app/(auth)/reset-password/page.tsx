import type { Metadata } from 'next'
import Link from 'next/link'

import { AuthCard, FadeIn } from '@/features/auth'
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form'

export const metadata: Metadata = {
      title: 'Reset Password — BpaY',
      description: 'Create a new password for your BpaY account.',
}

export default function ResetPasswordPage() {
      return (
            <FadeIn direction="up" delay={0.04} className="w-full">
                  <AuthCard
                        title="Create new password"
                        description="Enter your new password below."
                        footer={
                              <Link
                                    href="/sign-in"
                                    className="font-medium text-accent hover:underline underline-offset-4 transition-colors"
                              >
                                    Back to sign in
                              </Link>
                        }
                  >
                        <ResetPasswordForm />
                  </AuthCard>
            </FadeIn>
      )
}
