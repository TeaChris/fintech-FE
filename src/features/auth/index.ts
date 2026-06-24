// Components
export { AuthLayout } from './components/auth-layout'
export { AuthFooter } from './components/auth-footer'
export { AuthCard } from './components/auth-card'
export { LogoMark } from './components/logo-mark'
export { FadeIn } from './components/fade-in'
export {
      AuthProvider,
      useAuthUser,
      useOptionalAuthUser,
} from './components/auth-provider'
export { Can, type CanProps } from './components/can'

// Config
export {
      isPublicRoute,
      isAuthPage,
      PUBLIC_ROUTES,
      SESSION_COOKIE_NAME,
      SIGN_IN_PATH,
      DEFAULT_AUTHENTICATED_PATH,
} from './auth.config'

// Guards
export {
      requireAuth,
      getAuthUser,
      requireRole,
      requirePermission,
      ForbiddenError,
} from './guards/auth.guard'

// RBAC
export {
      ROLES,
      PERMISSIONS,
      ROLE_PERMISSIONS,
      isValidRole,
      hasRole,
      hasAnyRole,
      hasPermission,
      hasAllPermissions,
      hasAnyPermission,
      getUserPermissions,
} from './rbac'
export type { Role, Permission, RbacUser } from './rbac'

// Hooks
export { usePermissions, type UsePermissionsReturn } from './hooks/use-permissions'

// Types
export type {
      AuthLayoutProps,
      AuthCardProps,
      AuthFooterLink,
      AuthFooterProps,
      LogoMarkProps,
      FadeInProps,
} from './types/auth.types'
