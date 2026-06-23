'use client'

/**
 * Authenticated user context provider.
 *
 * The authenticated layout fetches the user server-side and passes
 * it to this provider. All child client components can then access
 * the user via `useAuthUser()` without additional API calls.
 *
 * Design decisions:
 * - User is fetched once in the layout (server-side) — no client fetch
 * - Context value is never null inside authenticated routes (enforced by layout)
 * - Separate `useOptionalAuthUser()` for edge cases outside protected routes
 */

import { createContext, useContext, type ReactNode } from 'react'
import type { AuthUser } from '@/api/sdk/auth/auth.api'

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthUserContext = createContext<AuthUser | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface AuthProviderProps {
      user: AuthUser
      children: ReactNode
}

/**
 * Provides the authenticated user to all child components.
 * Must be rendered inside the authenticated layout.
 */
export function AuthProvider({ user, children }: AuthProviderProps) {
      return (
            <AuthUserContext.Provider value={user}>
                  {children}
            </AuthUserContext.Provider>
      )
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Get the authenticated user. Throws if called outside authenticated routes.
 *
 * This is safe to call in any component rendered within `(authenticated)/`
 * because the layout guarantees the user is loaded before rendering children.
 *
 * @example
 * ```tsx
 * 'use client'
 * import { useAuthUser } from '@/features/auth'
 *
 * function DashboardHeader() {
 *   const user = useAuthUser()
 *   return <span>Welcome, {user.displayName ?? user.email}</span>
 * }
 * ```
 */
export function useAuthUser(): AuthUser {
      const user = useContext(AuthUserContext)
      if (!user) {
            throw new Error(
                  'useAuthUser() must be used within an authenticated route. ' +
                  'Ensure this component is rendered inside (authenticated)/ layout.',
            )
      }
      return user
}

/**
 * Get the authenticated user, or null if not available.
 *
 * Use this for components that may render in both authenticated
 * and unauthenticated contexts (e.g., a shared navbar).
 */
export function useOptionalAuthUser(): AuthUser | null {
      return useContext(AuthUserContext)
}
