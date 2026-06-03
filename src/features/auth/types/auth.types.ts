/**
 * Auth Layout System — Shared Types
 *
 * These types define the public API for all reusable auth layout components.
 * Any auth page can compose these components with full type safety.
 */

/** A single link rendered in the auth footer. */
export interface AuthFooterLink {
  /** Visible link text */
  label: string;
  /** Navigation target — can be a relative path or external URL */
  href: string;
}

/** Props for the full-page auth layout wrapper. */
export interface AuthLayoutProps {
  children: React.ReactNode;
  /**
   * Optional slot for content beside the main card area.
   * Use for testimonials, illustrations, or branding on desktop.
   * Hidden on mobile — only shown at `lg` breakpoint and above.
   */
  sideContent?: React.ReactNode;
  /** Whether to show trust indicators (encryption, compliance). Defaults to `true`. */
  showTrustIndicators?: boolean;
  /** Override the default footer links (Terms, Privacy, Help). */
  footerLinks?: AuthFooterLink[];
  /** Optional action rendered in the header (e.g., a "Sign Up" link). */
  headerAction?: React.ReactNode;
}

/** Props for the standardized auth card container. */
export interface AuthCardProps {
  children: React.ReactNode;
  /** Page heading displayed at the top of the card (e.g., "Sign in to your account"). */
  title: string;
  /** Short contextual subtitle below the title. */
  description?: string;
  /**
   * Optional content rendered below the card body.
   * Typically used for alternate navigation (e.g., "Don't have an account? Sign up").
   */
  footer?: React.ReactNode;
  /** Additional className merged onto the outer Card element. */
  className?: string;
}

/** Props for the auth header bar. */
export interface AuthHeaderProps {
  /**
   * Optional right-aligned action slot.
   * Common usage: a link to the alternate auth page.
   *
   * @example
   * ```tsx
   * <AuthHeader action={<Link href="/sign-up">Create account</Link>} />
   * ```
   */
  action?: React.ReactNode;
}

/** Props for the trust indicators component. */
export interface TrustIndicatorsProps {
  /** Additional className merged onto the container. */
  className?: string;
}

/** Props for the auth footer. */
export interface AuthFooterProps {
  /** Override the default set of footer links. */
  links?: AuthFooterLink[];
  /** Additional className merged onto the footer element. */
  className?: string;
}
