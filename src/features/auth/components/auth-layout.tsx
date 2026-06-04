import { cn } from '@/lib/utils'

import type { AuthLayoutProps } from '@/features/auth/types/auth.types'
import { AuthHeader } from '@/features/auth/components/auth-header'
import { AuthFooter } from '@/features/auth/components/auth-footer'
import { TrustIndicators } from '@/features/auth/components/trust-indicators'
import { LogoMark } from '@/features/auth/components/logo-mark'
import { FadeIn } from '@/features/auth/components/fade-in'
import { AuthNav } from './auth.nav'

export function AuthLayout({
      children,
      headline = 'Access your BpaY account',
      description = 'Securely sign in to manage payments, balances, transfers, and business operations.',
      showTrustIndicators = true,
      footerLinks,
}: AuthLayoutProps) {
      return (
            <div className="min-h-svh bg-background ">
                  <AuthNav />

                  {/* ── Right content area ─────────────────────────────────────── */}
                  <main className="hidden lg:grid lg:grid-cols-3">
                        {/* Mobile header */}
                        <header className="flex items-center px-6 py-5 lg:hidden">
                              <LogoMark />
                        </header>

                        {/* Centered card area */}
                        <div className="flex flex-1 items-center justify-center px-6 py-8 sm:px-10">
                              {children}
                        </div>

                        {/* Mobile footer */}
                        <div className="px-6 pb-6 lg:hidden">
                              {showTrustIndicators ? (
                                    <TrustIndicators className="mb-4 flex-row flex-wrap gap-x-5 text-muted-foreground [&_svg]:opacity-100 [&_span]:opacity-100" />
                              ) : null}
                              <AuthFooter
                                    links={footerLinks}
                                    className="justify-center"
                              />
                        </div>
                  </main>
            </div>
      )
}
