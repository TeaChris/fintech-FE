/**
 * Server-side authentication & authorization guards.
 *
 * Three levels of enforcement:
 *   1. requireAuth()       — validates session, returns AuthUser
 *   2. requireRole()       — validates session + checks role
 *   3. requirePermission() — validates session + checks permission(s)
 *
 * These are used in Server Actions and Server Components.
 * They call GET /auth/me to validate the session with the backend.
 *
 * IMPORTANT: These guards complement (not replace) the backend's
 * `authenticate` and `authorize()` middleware. The backend independently
 * verifies authorization on every API call.
 */

import 'server-only'

import { createServerClient } from '@/api/server'
import { createAuthApi } from '@/api/sdk/auth/auth.api'
import type { AuthUser } from '@/api/sdk/auth/auth.api'
import { hasAnyRole, hasAllPermissions } from '@/features/auth/rbac'
import type { Role, Permission } from '@/features/auth/rbac'

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/**
 * Thrown when a user is authenticated but lacks the required role/permission.
 * Distinct from auth errors so callers can differentiate 401 vs 403.
 */
export class ForbiddenError extends Error {
      public readonly name = 'ForbiddenError'
      public readonly user: AuthUser
      public readonly requiredRoles?: Role[]
      public readonly requiredPermissions?: Permission[]

      constructor(
            user: AuthUser,
            options?: {
                  roles?: Role[]
                  permissions?: Permission[]
            },
      ) {
            const detail = options?.roles
                  ? `roles: ${options.roles.join(', ')}`
                  : options?.permissions
                        ? `permissions: ${options.permissions.join(', ')}`
                        : 'elevated access'

            super(
                  `Access denied. User "${user.email}" (role: ${user.role}) lacks ${detail}.`,
            )
            this.user = user
            this.requiredRoles = options?.roles
            this.requiredPermissions = options?.permissions
      }
}

// ---------------------------------------------------------------------------
// Authentication Guard
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Authorization Guards
// ---------------------------------------------------------------------------

/**
 * Require an authenticated user with one of the specified roles.
 *
 * @throws {ForbiddenError} if the user's role is not in the allowed list
 *
 * @example
 * ```ts
 * // In a Server Action
 * const user = await requireRole('admin', 'compliance')
 * ```
 */
export async function requireRole(...roles: Role[]): Promise<AuthUser> {
      const user = await requireAuth()

      if (!hasAnyRole(user, roles)) {
            throw new ForbiddenError(user, { roles })
      }

      return user
}

/**
 * Require an authenticated user with ALL of the specified permissions.
 *
 * @throws {ForbiddenError} if the user lacks any of the required permissions
 *
 * @example
 * ```ts
 * // In a Server Action
 * const user = await requirePermission('audit:read', 'users:read:all')
 * ```
 */
export async function requirePermission(
      ...permissions: Permission[]
): Promise<AuthUser> {
      const user = await requireAuth()

      if (!hasAllPermissions(user, permissions)) {
            throw new ForbiddenError(user, { permissions })
      }

      return user
}
