import { cn } from "@/lib/utils";

import type { AuthLayoutProps } from "@/features/auth/types/auth.types";
import { AuthFooter } from "@/features/auth/components/auth-footer";
import { AuthNav } from "./auth.nav";
import { LockKeyhole, ShieldCheck, UserRoundX, Star } from "lucide-react";

const TRUST_ITEMS = [
      { icon: LockKeyhole, label: "256-bit encryption" },
      { icon: ShieldCheck, label: "SOC 2 Type II compliant" },
      { icon: UserRoundX, label: "Your data is never shared" },
] as const;

const FOOTER_TRUST_ITEMS = [
      { icon: LockKeyhole, label: "256-bit encryption" },
      { icon: ShieldCheck, label: "SOC 2 Type II compliant" },
] as const;

export function AuthLayout({ children }: AuthLayoutProps) {
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
                                                "flex h-12 w-12 items-center justify-center rounded-full",
                                                "border-2 border-accent/30 bg-accent/5",
                                          )}
                                          aria-hidden="true"
                                    >
                                          <ShieldCheck className="h-6 w-6 text-accent" />
                                    </div>

                                    {/* Heading */}
                                    <div className="flex flex-col gap-1.5">
                                          <h2 className="text-card-title text-foreground">
                                                Secure. Private. Reliable.
                                          </h2>
                                          <p className="text-body-sm leading-relaxed">
                                                Your security is our priority.
                                                All data is encrypted and
                                                protected.
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
                                                &ldquo;BpaY gives us the
                                                confidence that our payments and
                                                data are in safe hands.&rdquo;
                                          </p>
                                          <footer className="text-xs text-muted-foreground">
                                                — Finance team,{" "}
                                                <cite className="not-italic font-medium text-accent">
                                                      Acme Inc.
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
      );
}
