import type { Metadata } from 'next'
import Link from 'next/link'

import { AuthCard, FadeIn } from '@/features/auth'
import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form'

export const metadata: Metadata = {
      title: 'Forgot Password — BpaY',
      description: 'Reset your BpaY password securely.',
}

export default function ForgotPasswordPage() {
      return (
            <FadeIn direction="up" delay={0.04} className="w-full">
                  <AuthCard
                        title="Reset your password"
                        description="Enter the email associated with your account and we'll send you a link to reset your password."
                        footer={
                              <Link
                                    href="/sign-in"
                                    className="font-medium text-accent hover:underline underline-offset-4 transition-colors"
                              >
                                    Back to sign in
                              </Link>
                        }
                  >
                        <ForgotPasswordForm />
                  </AuthCard>
            </FadeIn>
      )
}
