/**
 * RBAC barrel export.
 */

// Constants
export {
      ROLES,
      PERMISSIONS,
      ROLE_PERMISSIONS,
      isValidRole,
      type Role,
      type Permission,
} from './rbac.constants'

// Utilities
export {
      hasRole,
      hasAnyRole,
      hasPermission,
      hasAllPermissions,
      hasAnyPermission,
      getUserPermissions,
      type RbacUser,
} from './rbac.utils'
