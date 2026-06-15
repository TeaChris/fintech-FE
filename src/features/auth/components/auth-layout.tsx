'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

import type { AuthLayoutProps } from '@/features/auth/types/auth.types'
import { AuthFooter } from '@/features/auth/components/auth-footer'
import { AuthNav } from './auth.nav'
import {
      LockKeyhole,
      ShieldCheck,
      UserRoundX,
      Star,
      Users,
      MailCheck,
      Key,
      Smartphone,
      ShieldAlert,
      type LucideIcon,
} from 'lucide-react'

const TRUST_ITEMS = [
      { icon: LockKeyhole, label: '256-bit encryption' },
      { icon: ShieldCheck, label: 'SOC 2 Type II compliant' },
      { icon: UserRoundX, label: 'Your data is never shared' },
] as const

const FOOTER_TRUST_ITEMS = [
      { icon: LockKeyhole, label: '256-bit encryption' },
      { icon: ShieldCheck, label: 'SOC 2 Type II compliant' },
] as const

type AuthContentConfig = {
      left: {
            icon: LucideIcon;
            title: string;
            description: string;
      };
      right: {
            quote: string;
            author: string;
            company: string;
      };
};

const AUTH_CONTENT: Record<string, AuthContentConfig> = {
      '/sign-in': {
            left: {
                  icon: ShieldCheck,
                  title: 'Secure. Private. Reliable.',
                  description:
                        'Your security is our priority. All data is encrypted and protected.',
            },
            right: {
                  quote: 'BpaY gives us the confidence that our payments and data are in safe hands.',
                  author: 'Finance team',
                  company: 'Acme Inc.',
            },
      },
      '/sign-up': {
            left: {
                  icon: Users,
                  title: 'Welcome to BpaY.',
                  description:
                        'Join thousands of businesses managing their finances seamlessly and securely.',
            },
            right: {
                  quote: "Setting up our accounts with BpaY took minutes, and we haven't looked back since.",
                  author: 'Sarah J.',
                  company: 'CEO of TechStart',
            },
      },
      '/verify-email': {
            left: {
                  icon: MailCheck,
                  title: 'Check your inbox.',
                  description:
                        'We verify emails to prevent fraud and keep your account fully secure.',
            },
            right: {
                  quote: 'Their verification process is quick and gives me peace of mind about my account.',
                  author: 'Alex T.',
                  company: 'Freelancer',
            },
      },
      '/email-verified': {
            left: {
                  icon: MailCheck,
                  title: "You're all set.",
                  description:
                        'Your email is verified. Access all features of your BpaY account securely.',
            },
            right: {
                  quote: 'The onboarding was flawless. I felt secure from the very first step.',
                  author: 'Jessica M.',
                  company: 'Boutique Owner',
            },
      },
      '/forgot-password': {
            left: {
                  icon: Key,
                  title: 'Account Recovery.',
                  description:
                        'Regain access to your account quickly and securely without hassle.',
            },
            right: {
                  quote: 'I forgot my password but recovering my account was incredibly smooth and secure.',
                  author: 'Michael R.',
                  company: 'Merchant',
            },
      },
      '/reset-password': {
            left: {
                  icon: Key,
                  title: 'Create new password.',
                  description:
                        'Ensure your new password is strong to keep your finances protected.',
            },
            right: {
                  quote: 'The password reset process was straightforward and made me feel my data is safe.',
                  author: 'David L.',
                  company: 'E-commerce Seller',
            },
      },
      '/password-updated': {
            left: {
                  icon: ShieldCheck,
                  title: 'Password updated.',
                  description:
                        'Your new password is now active. You can safely log back into your account.',
            },
            right: {
                  quote: "BpaY's security measures are top-notch. Resetting my credentials was a breeze.",
                  author: 'Emma S.',
                  company: 'Consultant',
            },
      },
      '/mfa': {
            left: {
                  icon: Smartphone,
                  title: 'Multi-Factor Auth.',
                  description:
                        'Add an extra layer of protection to your transactions and data.',
            },
            right: {
                  quote: 'The extra security layer ensures no unauthorized access to our company funds.',
                  author: 'Elena P.',
                  company: 'Operations Manager',
            },
      },
      '/recovery': {
            left: {
                  icon: Smartphone,
                  title: 'Emergency Access.',
                  description:
                        'Use your secure backup codes to bypass MFA when you lose your device.',
            },
            right: {
                  quote: 'Having recovery codes saved me when I lost my phone on a business trip.',
                  author: 'Robert C.',
                  company: 'Sales Director',
            },
      },
      '/locked': {
            left: {
                  icon: ShieldAlert,
                  title: 'Security Alert.',
                  description:
                        'We actively monitor for suspicious activities to protect your assets.',
            },
            right: {
                  quote: 'Knowing they proactively lock accounts after suspicious attempts lets me sleep at night.',
                  author: 'David K.',
                  company: 'Investor',
            },
      },
}

export function AuthLayout({ children }: AuthLayoutProps) {
      const pathname = usePathname()
      const content = (AUTH_CONTENT[pathname] || AUTH_CONTENT['/sign-in']) as AuthContentConfig
      const LeftIcon = content.left.icon

      return (
            <div className="flex min-h-svh flex-col bg-background">
                  <AuthNav />

                  {/* ── Main three-column grid (desktop only) ── */}
                  <main className="hidden flex-1 lg:grid lg:grid-cols-[minmax(260px,1fr)_minmax(420px,1.5fr)_minmax(260px,1fr)] px-12 xl:px-20 py-10 gap-4">
                        {/* ── Left: Security panel ── */}
                        <aside
                              className="flex items-center justify-center"
                              aria-label="Security information"
                        >
                              <div className="flex flex-col gap-5 max-w-70">
                                    {/* Shield icon */}
                                    <div
                                          className={cn(
                                                'flex h-12 w-12 items-center justify-center rounded-full',
                                                'border-2 border-accent/30 bg-accent/5',
                                          )}
                                          aria-hidden="true"
                                    >
                                          <LeftIcon className="h-6 w-6 text-accent" />
                                    </div>

                                    {/* Heading */}
                                    <div className="flex flex-col gap-1.5">
                                          <h2 className="text-card-title text-foreground">
                                                {content.left.title}
                                          </h2>
                                          <p className="text-body-sm leading-relaxed">
                                                {content.left.description}
                                          </p>
                                    </div>

                                    {/* Trust indicators */}
                                    <ul
                                          className="flex flex-col gap-3"
                                          role="list"
                                    >
                                          {TRUST_ITEMS.map((item) => (
                                                <li
                                                      key={item.label}
                                                      className="flex items-center gap-2.5 text-sm text-muted-foreground"
                                                >
                                                      <item.icon
                                                            className="size-4 shrink-0 opacity-60"
                                                            aria-hidden="true"
                                                      />
                                                      <span className="opacity-80">
                                                            {item.label}
                                                      </span>
                                                </li>
                                          ))}
                                    </ul>
                              </div>
                        </aside>

                        {/* ── Center: Form area ── */}
                        <div className="flex items-center justify-center">
                              {children}
                        </div>

                        {/* ── Right: Testimonial panel ── */}
                        <aside
                              className="flex items-center justify-center"
                              aria-label="Customer testimonial"
                        >
                              <div className="flex max-w-70 flex-col gap-4">
                                    {/* Star rating */}
                                    <div
                                          className="flex items-center gap-0.5"
                                          role="img"
                                          aria-label="5 out of 5 stars"
                                    >
                                          {Array.from({ length: 5 }).map(
                                                (_, i) => (
                                                      <Star
                                                            key={i}
                                                            className="size-5 fill-accent text-accent"
                                                            aria-hidden="true"
                                                      />
                                                ),
                                          )}
                                    </div>

                                    {/* Quote */}
                                    <blockquote className="border-0 p-0 m-0 text-sm leading-relaxed text-muted-foreground not-italic">
                                          <p className="mb-3">
                                                &ldquo;{content.right.quote}
                                                &rdquo;
                                          </p>
                                          <footer className="text-xs text-muted-foreground">
                                                — {content.right.author},{' '}
                                                <cite className="not-italic font-medium text-accent">
                                                      {content.right.company}
                                                </cite>
                                          </footer>
                                    </blockquote>
                              </div>
                        </aside>
                  </main>

                  {/* ── Mobile layout (visible below lg) ── */}
                  <main className="flex flex-1 items-start justify-center px-4 py-8 lg:hidden">
                        {children}
                  </main>

                  {/* ── Footer ── */}
                  <footer className="flex flex-col items-center gap-3 px-6 pb-6 pt-2">
                        {/* Trust badges row */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {FOOTER_TRUST_ITEMS.map((item, index) => (
                                    <div
                                          key={item.label}
                                          className="flex items-center gap-1.5"
                                    >
                                          <item.icon
                                                className="size-3.5 opacity-50"
                                                aria-hidden="true"
                                          />
                                          <span>{item.label}</span>
                                          {index <
                                                FOOTER_TRUST_ITEMS.length -
                                                      1 && (
                                                <span
                                                      className="ml-2.5 opacity-30"
                                                      aria-hidden="true"
                                                >
                                                      ·
                                                </span>
                                          )}
                                    </div>
                              ))}
                        </div>

                        {/* Legal links */}
                        <AuthFooter className="justify-center" />
                  </footer>
            </div>
      )
}
