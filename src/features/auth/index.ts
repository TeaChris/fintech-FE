/**
 * Auth Feature — Public API
 *
 * All auth layout components and types are exported from here.
 * Import from `@/features/auth` rather than individual component files.
 *
 * @example
 * ```tsx
 * import { AuthLayout, AuthCard } from '@/features/auth';
 * ```
 */

export { AuthLayout } from "./components/auth-layout";
export { AuthCard } from "./components/auth-card";
export { AuthHeader } from "./components/auth-header";
export { AuthFooter } from "./components/auth-footer";
export { TrustIndicators } from "./components/trust-indicators";
export { LogoMark } from "./components/logo-mark";

export type {
  AuthLayoutProps,
  AuthCardProps,
  AuthHeaderProps,
  AuthFooterLink,
  AuthFooterProps,
  TrustIndicatorsProps,
} from "./types/auth.types";
