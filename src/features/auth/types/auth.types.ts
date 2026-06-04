/** A single link rendered in the auth footer. */
export interface AuthFooterLink {
  label: string;
  href: string;
}

/** Props for the full-page two-column auth layout. */
export interface AuthLayoutProps {
  children: React.ReactNode;
  /** Headline for the left brand panel. */
  headline?: string;
  /** Description for the left brand panel. */
  description?: string;
  /** Show trust indicators in the left panel. Defaults to `true`. */
  showTrustIndicators?: boolean;
  /** Override the default footer links. */
  footerLinks?: AuthFooterLink[];
}

/** Props for the standardized auth card container. */
export interface AuthCardProps {
  children: React.ReactNode;
  /** Card heading (e.g., "Welcome back"). */
  title: string;
  /** Subtitle below the heading. */
  description?: string;
  /** Optional footer content (e.g., "Don't have an account?"). */
  footer?: React.ReactNode;
  /** Additional className merged onto the outer Card. */
  className?: string;
}

/** Props for the brand header section (logo + headline + description). */
export interface AuthHeaderProps {
  /** Brand headline text. */
  headline?: string;
  /** Brand description text. */
  description?: string;
  /** Additional className. */
  className?: string;
}

/** Props for the trust indicators component. */
export interface TrustIndicatorsProps {
  className?: string;
}

/** Props for the auth footer. */
export interface AuthFooterProps {
  links?: AuthFooterLink[];
  className?: string;
  /** Use "light" for dark backgrounds (brand panel). */
  variant?: "light" | "default";
}

/** Props for the LogoMark component. */
export interface LogoMarkProps {
  className?: string;
  /** Use "light" for dark backgrounds (brand panel). */
  variant?: "light" | "default";
}

/** Props for the FadeIn motion wrapper. */
export interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  /** Delay before animation starts (seconds). */
  delay?: number;
  /** Direction of the slide animation. */
  direction?: "up" | "down" | "left" | "right" | "none";
}
