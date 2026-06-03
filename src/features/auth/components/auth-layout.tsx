import { cn } from "@/lib/utils";

import type { AuthLayoutProps } from "@/features/auth/types/auth.types";
import { AuthHeader } from "@/features/auth/components/auth-header";
import { AuthFooter } from "@/features/auth/components/auth-footer";
import { TrustIndicators } from "@/features/auth/components/trust-indicators";

/**
 * Full-page layout wrapper for all auth routes.
 *
 * Orchestrates the header, main content area, trust indicators, and footer
 * into a consistent full-viewport layout. Supports an optional side content
 * panel for desktop (hidden on mobile).
 *
 * Layout structure:
 * ```
 * ┌─────────────────────────────────┐
 * │  AuthHeader (logo + action)     │
 * ├─────────────────────────────────┤
 * │                                 │
 * │   [sideContent]? | AuthCard     │
 * │                                 │
 * ├─────────────────────────────────┤
 * │  TrustIndicators                │
 * │  AuthFooter                     │
 * └─────────────────────────────────┘
 * ```
 *
 * @example
 * ```tsx
 * // Basic usage — centered card layout
 * <AuthLayout>
 *   <AuthCard title="Sign in">...</AuthCard>
 * </AuthLayout>
 *
 * // With side content (split layout on desktop)
 * <AuthLayout sideContent={<TestimonialPanel />}>
 *   <AuthCard title="Sign in">...</AuthCard>
 * </AuthLayout>
 * ```
 */
export function AuthLayout({
  children,
  sideContent,
  showTrustIndicators = true,
  footerLinks,
  headerAction,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <AuthHeader action={headerAction} />

      {sideContent ? (
        <main className="flex flex-1">
          {/* Side content — hidden on mobile, shown on lg+ */}
          <div
            className={cn(
              "hidden lg:flex lg:flex-1",
              "items-center justify-center",
              "border-r border-border bg-muted/30 px-8"
            )}
          >
            {sideContent}
          </div>

          {/* Card area */}
          <div className="flex flex-1 items-center justify-center px-6 py-8 sm:px-8">
            {children}
          </div>
        </main>
      ) : (
        <main className="flex flex-1 items-center justify-center px-6 py-8 sm:px-8">
          {children}
        </main>
      )}

      <div className="flex flex-col items-center gap-1 pb-2">
        {showTrustIndicators ? <TrustIndicators /> : null}
        <AuthFooter links={footerLinks} />
      </div>
    </div>
  );
}
