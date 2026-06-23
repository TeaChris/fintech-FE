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
export { requireAuth, getAuthUser } from './guards/auth.guard'

// Types
export type {
      AuthLayoutProps,
      AuthCardProps,
      AuthFooterLink,
      AuthFooterProps,
      LogoMarkProps,
      FadeInProps,
} from './types/auth.types'
