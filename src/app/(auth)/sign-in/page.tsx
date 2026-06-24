import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { AuthCard, FadeIn } from '@/features/auth'
import { SignInForm } from '@/features/auth/components/sign-in-form'

export const metadata: Metadata = {
      title: 'Sign In — BpaY',
      description:
            'Sign in to your BpaY account to manage payments, balances, and transfers securely.',
}

export default function SignInPage() {
      return (
            <FadeIn direction="up" delay={0.04} className="w-full">
                  <AuthCard
                        title="Welcome back"
                        description="Sign in to access your BpaY account"
                        footer={
                              <p>
                                    Don&apos;t have an account?{' '}
                                    <Link
                                          href="/sign-up"
                                          className="font-medium text-accent underline underline-offset-4 transition-colors hover:text-foreground"
                                    >
                                          Sign up
                                    </Link>
                              </p>
                        }
                  >
                        <Suspense fallback={<div className="h-40 w-full animate-pulse bg-muted rounded-md" />}>
                              <SignInForm />
                        </Suspense>
                  </AuthCard>
            </FadeIn>
      )
}
