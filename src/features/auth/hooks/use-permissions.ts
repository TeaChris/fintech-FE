'use client'

/**
 * Client-side permission hook.
 *
 * Derives permissions from the AuthUser context (set by the authenticated
 * layout). Provides convenience methods for role and permission checks
 * in client components.
 *
 * @example
 * ```tsx
 * function AdminButton() {
 *   const { hasRole, can } = usePermissions()
 *
 *   if (!hasRole('admin')) return null
 *
 *   return <button onClick={openAdminPanel}>Admin Panel</button>
 * }
 * ```
 *
 * @example
 * ```tsx
 * function AuditSection() {
 *   const { can } = usePermissions()
 *
 *   return (
 *     <>
 *       {can('audit:read') && <AuditLogViewer />}
 *       {can('audit:read:all') && <FullAuditExport />}
 *     </>
 *   )
 * }
 * ```
 */

import { useMemo } from 'react'
import { useAuthUser } from '../components/auth-provider'
import {
      hasRole as checkRole,
      hasAnyRole as checkAnyRole,
      hasPermission as checkPermission,
      hasAllPermissions as checkAllPermissions,
      hasAnyPermission as checkAnyPermission,
      getUserPermissions,
} from '../rbac'
import type { Role, Permission } from '../rbac'

export interface UsePermissionsReturn {
      /** The user's current role */
      role: string

      /** All resolved permissions for the user's role */
      permissions: ReadonlySet<Permission>

      /** Check if the user has a specific role */
      hasRole: (role: Role) => boolean

      /** Check if the user has any of the specified roles */
      hasAnyRole: (roles: readonly Role[]) => boolean

      /** Check if the user has a specific permission */
      can: (permission: Permission) => boolean

      /** Check if the user has ALL of the specified permissions */
      canAll: (permissions: readonly Permission[]) => boolean

      /** Check if the user has ANY of the specified permissions */
      canAny: (permissions: readonly Permission[]) => boolean

      /** Whether the user is an admin (bypasses all permission checks) */
      isAdmin: boolean
}

/**
 * Hook providing permission-checking utilities for client components.
 *
 * Must be called within an authenticated route (inside `(authenticated)/` layout).
 * The hook reads the user from AuthUserContext and derives permissions from
 * the role→permission mapping.
 */
export function usePermissions(): UsePermissionsReturn {
      const user = useAuthUser()

      return useMemo(() => {
            const permissions = getUserPermissions(user)

            return {
                  role: user.role,
                  permissions,
                  isAdmin: user.role === 'admin',
                  hasRole: (role: Role) => checkRole(user, role),
                  hasAnyRole: (roles: readonly Role[]) =>
                        checkAnyRole(user, roles),
                  can: (permission: Permission) =>
                        checkPermission(user, permission),
                  canAll: (perms: readonly Permission[]) =>
                        checkAllPermissions(user, perms),
                  canAny: (perms: readonly Permission[]) =>
                        checkAnyPermission(user, perms),
            }
      }, [user])
}
