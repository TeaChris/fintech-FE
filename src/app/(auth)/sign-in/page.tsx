import type { Metadata } from 'next'
import Link from 'next/link'

import { AuthCard, FadeIn } from '@/features/auth'
import { SignInForm } from '@/features/auth/components/sign-in-form'

export const metadata: Metadata = {
      title: 'Sign In — BpaY',
      description:
            'Sign in to your BpaY account to manage payments, balances, and transfers securely.',
}

export default function SignInPage() {
      return (
            <FadeIn direction="up" delay={0.04}>
                  <AuthCard
                        title="Welcome back"
                        description="Sign in to access your BpaY account."
                        footer={
                              <p>
                                    Don&apos;t have an account?{' '}
                                    <Link
                                          href="/sign-up"
                                          className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary "
                                    >
                                          Sign up
                                    </Link>
                              </p>
                        }
                  >
                        <SignInForm />
                  </AuthCard>
            </FadeIn>
      )
}
