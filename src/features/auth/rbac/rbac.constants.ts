/**
 * RBAC constants — frontend mirror of the PAY backend's role/permission model.
 *
 * IMPORTANT: These MUST stay in sync with the backend's
 * `src/modules/permissions/rbac.constants.ts`.
 *
 * The backend is the source of truth. If roles or permissions change there,
 * they must be updated here. Consider generating from a shared schema in
 * the future to eliminate drift.
 */

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

/**
 * Application roles — matches PAY backend `DEFAULT_ROLES` exactly.
 *
 * Role hierarchy (implicit, not enforced — admin bypasses all checks):
 *   user < support < compliance < admin
 */
export const ROLES = ['user', 'admin', 'support', 'compliance'] as const

export type Role = (typeof ROLES)[number]

/**
 * Type guard to check if a string is a valid Role.
 */
export function isValidRole(value: string): value is Role {
      return (ROLES as readonly string[]).includes(value)
}

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

/**
 * Permission constants — matches PAY backend `DEFAULT_PERMISSIONS` exactly.
 *
 * Format: `resource:action[:scope]`
 *   - resource: the domain entity (users, audit, sessions, etc.)
 *   - action: the operation (read, update, delete, manage)
 *   - scope: optional qualifier (self = own data, any = any user's data, all = bulk)
 */
export const PERMISSIONS = {
      // Audit
      AUDIT_READ: 'audit:read',
      AUDIT_READ_ALL: 'audit:read:all',

      // Users
      USERS_READ_SELF: 'users:read:self',
      USERS_READ_ANY: 'users:read:any',
      USERS_READ_ALL: 'users:read:all',
      USERS_UPDATE_SELF: 'users:update:self',
      USERS_DELETE_ANY: 'users:delete:any',

      // Sessions
      SESSIONS_READ_SELF: 'sessions:read:self',
      SESSIONS_READ_ANY: 'sessions:read:any',
      SESSIONS_DELETE_SELF: 'sessions:delete:self',

      // MFA
      MFA_MANAGE_SELF: 'mfa:manage:self',

      // RBAC
      RBAC_MANAGE: 'rbac:manage',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

// ---------------------------------------------------------------------------
// Role → Permission Mapping
// ---------------------------------------------------------------------------

/**
 * Maps each role to its granted permissions.
 * Mirrors PAY backend `ROLE_PERMISSION_MAP` exactly.
 *
 * Admin bypasses all permission checks (handled in `hasPermission()`).
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
      user: [
            PERMISSIONS.USERS_READ_SELF,
            PERMISSIONS.USERS_UPDATE_SELF,
            PERMISSIONS.SESSIONS_READ_SELF,
            PERMISSIONS.SESSIONS_DELETE_SELF,
            PERMISSIONS.MFA_MANAGE_SELF,
      ],
      support: [
            PERMISSIONS.USERS_READ_SELF,
            PERMISSIONS.USERS_UPDATE_SELF,
            PERMISSIONS.SESSIONS_READ_SELF,
            PERMISSIONS.SESSIONS_DELETE_SELF,
            PERMISSIONS.MFA_MANAGE_SELF,
            PERMISSIONS.USERS_READ_ANY,
            PERMISSIONS.SESSIONS_READ_ANY,
            PERMISSIONS.AUDIT_READ,
      ],
      compliance: [
            PERMISSIONS.USERS_READ_SELF,
            PERMISSIONS.USERS_UPDATE_SELF,
            PERMISSIONS.SESSIONS_READ_SELF,
            PERMISSIONS.SESSIONS_DELETE_SELF,
            PERMISSIONS.MFA_MANAGE_SELF,
            PERMISSIONS.USERS_READ_ANY,
            PERMISSIONS.SESSIONS_READ_ANY,
            PERMISSIONS.AUDIT_READ,
            PERMISSIONS.AUDIT_READ_ALL,
            PERMISSIONS.USERS_READ_ALL,
      ],
      // Admin gets every permission (also bypasses checks in hasPermission)
      admin: Object.values(PERMISSIONS),
} as const
