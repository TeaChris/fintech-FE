/**
 * Authentication route configuration — single source of truth.
 *
 * Used by both Next.js middleware (edge runtime) and server-side layouts
 * to determine which routes are public vs protected.
 *
 * Design decisions:
 * - Public routes are explicitly listed (default-deny model)
 * - Cookie name matches what the backend sets and server-fetcher forwards
 * - Separated from the API client config to avoid importing heavy modules in middleware
 */

// ---------------------------------------------------------------------------
// Public Routes
// ---------------------------------------------------------------------------

/**
 * Routes that do NOT require authentication.
 * Everything else is protected by default (default-deny).
 *
 * These are path prefixes — `/sign-in/anything` would also match.
 */
export const PUBLIC_ROUTES: readonly string[] = [
      // Auth flows
      '/sign-in',
      '/sign-up',
      '/verify-email',
      '/forgot-password',
      '/reset-password',
      '/mfa',
      '/recovery',
      '/locked',
      '/email-verified',
      '/password-updated',

      // Marketing / legal (add as needed)
      '/terms',
      '/privacy',
] as const

/**
 * The root path "/" is treated separately —
 * it's the landing page and is public.
 */
export const ROOT_PATH = '/'

// ---------------------------------------------------------------------------
// Cookie & Path Constants
// ---------------------------------------------------------------------------

/**
 * The cookie that indicates an active session.
 * We only check for its *presence*, not validity (that's the backend's job).
 * Must match the cookie name set by the PAY backend on login.
 */
export const SESSION_COOKIE_NAME = 'access_token'

/** Where unauthenticated users are redirected */
export const SIGN_IN_PATH = '/sign-in'

/** Default destination after successful authentication */
export const DEFAULT_AUTHENTICATED_PATH = '/dashboard'

// ---------------------------------------------------------------------------
// Route Matching Utilities
// ---------------------------------------------------------------------------

/**
 * Check if a given pathname is a public route.
 *
 * A route is public if:
 * - It's the root path "/"
 * - It starts with one of the PUBLIC_ROUTES prefixes
 */
export function isPublicRoute(pathname: string): boolean {
      if (pathname === ROOT_PATH) return true

      return PUBLIC_ROUTES.some((route) => {
            // Exact match
            if (pathname === route) return true
            // Prefix match (e.g., "/sign-in" matches "/sign-in/callback")
            if (pathname.startsWith(`${route}/`)) return true
            return false
      })
}

/**
 * Check if a given pathname is an auth page (sign-in, sign-up, etc.).
 * Used to redirect already-authenticated users away from auth pages.
 */
const AUTH_PAGES: readonly string[] = [
      '/sign-in',
      '/sign-up',
] as const

export function isAuthPage(pathname: string): boolean {
      return AUTH_PAGES.some((page) => {
            if (pathname === page) return true
            if (pathname.startsWith(`${page}/`)) return true
            return false
      })
}
