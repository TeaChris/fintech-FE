/**
 * RBAC utility functions — pure, isomorphic (server + client).
 *
 * These functions check roles and permissions against the user object
 * returned by GET /auth/me. They are intentionally pure (no side effects,
 * no throws) so they can be used in:
 *   - Server Components
 *   - Client Components (via usePermissions hook)
 *   - Server Actions (via requireRole/requirePermission guards)
 *   - Tests
 *
 * IMPORTANT: These are UX optimizations. The backend `authorize()` middleware
 * is the real security gate. Frontend checks prevent users from seeing UI
 * they can't use — they do NOT replace backend enforcement.
 */

import {
      ROLE_PERMISSIONS,
      isValidRole,
      type Role,
      type Permission,
} from './rbac.constants'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Minimal user shape required for permission checks.
 * Compatible with AuthUser from the SDK.
 */
export interface RbacUser {
      role: string
}

// ---------------------------------------------------------------------------
// Role Checks
// ---------------------------------------------------------------------------

/**
 * Check if a user has a specific role.
 */
export function hasRole(user: RbacUser, role: Role): boolean {
      return user.role === role
}

/**
 * Check if a user has any of the specified roles.
 */
export function hasAnyRole(user: RbacUser, roles: readonly Role[]): boolean {
      return roles.some((role) => user.role === role)
}

// ---------------------------------------------------------------------------
// Permission Checks
// ---------------------------------------------------------------------------

/**
 * Get the resolved permissions for a user based on their role.
 * Returns an empty set for unknown roles (fail-closed).
 */
export function getUserPermissions(user: RbacUser): ReadonlySet<Permission> {
      // Admin bypasses — gets all permissions
      if (user.role === 'admin') {
            return new Set(
                  Object.values(
                        ROLE_PERMISSIONS,
                  ).flat() as Permission[],
            )
      }

      if (!isValidRole(user.role)) {
            // Unknown role → no permissions (fail-closed)
            return new Set()
      }

      return new Set(ROLE_PERMISSIONS[user.role])
}

/**
 * Check if a user has a specific permission.
 */
export function hasPermission(
      user: RbacUser,
      permission: Permission,
): boolean {
      // Admin bypasses all permission checks (mirrors backend behavior)
      if (user.role === 'admin') return true

      if (!isValidRole(user.role)) return false

      const perms = ROLE_PERMISSIONS[user.role]
      return perms.includes(permission)
}

/**
 * Check if a user has ALL of the specified permissions (AND logic).
 */
export function hasAllPermissions(
      user: RbacUser,
      permissions: readonly Permission[],
): boolean {
      return permissions.every((perm) => hasPermission(user, perm))
}

/**
 * Check if a user has ANY of the specified permissions (OR logic).
 */
export function hasAnyPermission(
      user: RbacUser,
      permissions: readonly Permission[],
): boolean {
      return permissions.some((perm) => hasPermission(user, perm))
}
