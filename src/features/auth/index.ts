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

export * from './components'

export type {
      AuthLayoutProps,
      AuthCardProps,
      AuthHeaderProps,
      AuthFooterLink,
      AuthFooterProps,
      TrustIndicatorsProps,
} from './types/auth.types'
