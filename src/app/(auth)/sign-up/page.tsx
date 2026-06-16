import type { Metadata } from 'next'
import Link from 'next/link'

import { AuthCard, FadeIn } from '@/features/auth'
import { SignUpForm } from '@/features/auth/components/sign-up-form'

export const metadata: Metadata = {
      title: 'Create Account — BpaY',
      description:
            'Create your BpaY account to get started.',
}

export default function SignUpPage() {
      return (
            <FadeIn direction="up" delay={0.04} className="w-full">
                  <AuthCard
                        title="Create your account"
                        description="Get started with BpaY"
                        footer={
                              <p>
                                    Already have an account?{' '}
                                    <Link
                                          href="/sign-in"
                                          className="font-medium text-accent underline underline-offset-4 transition-colors hover:text-foreground"
                                    >
                                          Sign in
                                    </Link>
                              </p>
                        }
                  >
                        <SignUpForm />
                  </AuthCard>
            </FadeIn>
      )
}
