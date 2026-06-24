'use client'

/**
 * Declarative permission-based rendering component.
 *
 * Renders children only when the current user has the required
 * role or permission. Optionally renders a fallback for denied access.
 *
 * @example Permission-based rendering
 * ```tsx
 * <Can permission="audit:read">
 *   <AuditLogButton />
 * </Can>
 * ```
 *
 * @example Role-based rendering
 * ```tsx
 * <Can role="admin">
 *   <AdminPanelLink />
 * </Can>
 * ```
 *
 * @example With fallback
 * ```tsx
 * <Can permission="users:delete:any" fallback={<DisabledButton />}>
 *   <DeleteUserButton />
 * </Can>
 * ```
 *
 * @example Multiple permissions (AND logic)
 * ```tsx
 * <Can permissions={['audit:read', 'audit:read:all']}>
 *   <FullAuditDashboard />
 * </Can>
 * ```
 *
 * @example Multiple roles (OR logic)
 * ```tsx
 * <Can roles={['admin', 'compliance']}>
 *   <ComplianceDashboard />
 * </Can>
 * ```
 */

import type { ReactNode } from 'react'
import { usePermissions } from '../hooks/use-permissions'
import type { Role, Permission } from '../rbac'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CanBaseProps {
      /** Content to render when the user HAS the required access */
      children: ReactNode
      /** Content to render when the user LACKS the required access */
      fallback?: ReactNode
}

interface CanWithRole extends CanBaseProps {
      /** Single role check */
      role: Role
      roles?: never
      permission?: never
      permissions?: never
}

interface CanWithRoles extends CanBaseProps {
      /** Multiple roles — user must have ANY (OR logic) */
      roles: readonly Role[]
      role?: never
      permission?: never
      permissions?: never
}

interface CanWithPermission extends CanBaseProps {
      /** Single permission check */
      permission: Permission
      permissions?: never
      role?: never
      roles?: never
}

interface CanWithPermissions extends CanBaseProps {
      /** Multiple permissions — user must have ALL (AND logic) */
      permissions: readonly Permission[]
      permission?: never
      role?: never
      roles?: never
}

export type CanProps =
      | CanWithRole
      | CanWithRoles
      | CanWithPermission
      | CanWithPermissions

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Can(props: CanProps) {
      const { children, fallback = null } = props
      const auth = usePermissions()

      let allowed = false

      if ('role' in props && props.role) {
            allowed = auth.hasRole(props.role)
      } else if ('roles' in props && props.roles) {
            allowed = auth.hasAnyRole(props.roles)
      } else if ('permission' in props && props.permission) {
            allowed = auth.can(props.permission)
      } else if ('permissions' in props && props.permissions) {
            allowed = auth.canAll(props.permissions)
      }

      return allowed ? <>{children}</> : <>{fallback}</>
}
