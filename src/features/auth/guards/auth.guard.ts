/**
 * Server-side authentication guard for Server Actions and Server Components.
 *
 * Validates the current session by calling GET /auth/me against the backend.
 * If the session is invalid (expired token, no cookie, etc.), the backend
 * returns 401 and we throw — the caller decides how to handle it.
 *
 * Usage in Server Actions:
 * ```ts
 * export async function someProtectedAction(payload) {
 *   const user = await requireAuth()
 *   // user is guaranteed to be valid here
 *   // proceed with business logic...
 * }
 * ```
 *
 * Usage in Server Components (layouts):
 * ```tsx
 * const user = await getAuthUser()
 * if (!user) redirect('/sign-in')
 * ```
 */

import 'server-only'

import { createServerClient } from '@/api/server'
import { createAuthApi } from '@/api/sdk/auth/auth.api'
import type { AuthUser } from '@/api/sdk/auth/auth.api'

/**
 * Require an authenticated user — throws if unauthenticated.
 *
 * Use this in Server Actions where an unauthenticated request
 * should be treated as an error (caught by the action's try/catch).
 */
export async function requireAuth(): Promise<AuthUser> {
      const client = await createServerClient()
      const authApi = createAuthApi(client)
      const { data } = await authApi.getProfile()
      return data
}

/**
 * Get the authenticated user — returns null if unauthenticated.
 *
 * Use this in Server Components/layouts where you want to
 * check auth status without throwing (e.g., to redirect).
 */
export async function getAuthUser(): Promise<AuthUser | null> {
      try {
            return await requireAuth()
      } catch {
            return null
      }
}
