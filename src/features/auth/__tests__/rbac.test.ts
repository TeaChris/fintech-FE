/**
 * Tests for RBAC (Role-Based Access Control) utilities.
 *
 * Validates:
 * - Role checking
 * - Permission checking
 * - Admin bypass behavior
 * - Fail-closed for unknown roles
 * - Role→Permission mapping correctness against backend
 */

import { describe, it, expect } from 'vitest'
import {
      ROLES,
      PERMISSIONS,
      ROLE_PERMISSIONS,
      isValidRole,
} from '../rbac/rbac.constants'
import {
      hasRole,
      hasAnyRole,
      hasPermission,
      hasAllPermissions,
      hasAnyPermission,
      getUserPermissions,
} from '../rbac/rbac.utils'

// ---------------------------------------------------------------------------
// Test Users (fixtures)
// ---------------------------------------------------------------------------

const userUser = { role: 'user' as const }
const adminUser = { role: 'admin' as const }
const supportUser = { role: 'support' as const }
const complianceUser = { role: 'compliance' as const }
const unknownUser = { role: 'hacker' }

// ---------------------------------------------------------------------------
// isValidRole
// ---------------------------------------------------------------------------

describe('isValidRole', () => {
      it.each(ROLES)('returns true for "%s"', (role) => {
            expect(isValidRole(role)).toBe(true)
      })

      it('returns false for unknown roles', () => {
            expect(isValidRole('hacker')).toBe(false)
            expect(isValidRole('superadmin')).toBe(false)
            expect(isValidRole('')).toBe(false)
      })
})

// ---------------------------------------------------------------------------
// hasRole
// ---------------------------------------------------------------------------

describe('hasRole', () => {
      it('returns true when user has the specified role', () => {
            expect(hasRole(adminUser, 'admin')).toBe(true)
            expect(hasRole(userUser, 'user')).toBe(true)
            expect(hasRole(supportUser, 'support')).toBe(true)
      })

      it('returns false when user does not have the specified role', () => {
            expect(hasRole(userUser, 'admin')).toBe(false)
            expect(hasRole(supportUser, 'admin')).toBe(false)
            expect(hasRole(adminUser, 'user')).toBe(false)
      })
})

// ---------------------------------------------------------------------------
// hasAnyRole
// ---------------------------------------------------------------------------

describe('hasAnyRole', () => {
      it('returns true when user has any of the specified roles', () => {
            expect(hasAnyRole(adminUser, ['admin', 'support'])).toBe(true)
            expect(hasAnyRole(supportUser, ['admin', 'support'])).toBe(true)
      })

      it('returns false when user has none of the specified roles', () => {
            expect(hasAnyRole(userUser, ['admin', 'support'])).toBe(false)
      })

      it('returns false for empty roles array', () => {
            expect(hasAnyRole(adminUser, [])).toBe(false)
      })
})

// ---------------------------------------------------------------------------
// hasPermission
// ---------------------------------------------------------------------------

describe('hasPermission', () => {
      it('grants user role their own permissions', () => {
            expect(hasPermission(userUser, PERMISSIONS.USERS_READ_SELF)).toBe(
                  true,
            )
            expect(hasPermission(userUser, PERMISSIONS.USERS_UPDATE_SELF)).toBe(
                  true,
            )
            expect(
                  hasPermission(userUser, PERMISSIONS.SESSIONS_READ_SELF),
            ).toBe(true)
            expect(hasPermission(userUser, PERMISSIONS.MFA_MANAGE_SELF)).toBe(
                  true,
            )
      })

      it('denies user role elevated permissions', () => {
            expect(hasPermission(userUser, PERMISSIONS.USERS_READ_ANY)).toBe(
                  false,
            )
            expect(hasPermission(userUser, PERMISSIONS.USERS_READ_ALL)).toBe(
                  false,
            )
            expect(hasPermission(userUser, PERMISSIONS.AUDIT_READ)).toBe(false)
            expect(hasPermission(userUser, PERMISSIONS.RBAC_MANAGE)).toBe(false)
            expect(hasPermission(userUser, PERMISSIONS.USERS_DELETE_ANY)).toBe(
                  false,
            )
      })

      it('grants support role user permissions + elevated read', () => {
            expect(
                  hasPermission(supportUser, PERMISSIONS.USERS_READ_SELF),
            ).toBe(true)
            expect(
                  hasPermission(supportUser, PERMISSIONS.USERS_READ_ANY),
            ).toBe(true)
            expect(
                  hasPermission(supportUser, PERMISSIONS.SESSIONS_READ_ANY),
            ).toBe(true)
            expect(hasPermission(supportUser, PERMISSIONS.AUDIT_READ)).toBe(
                  true,
            )
      })

      it('denies support role admin-only permissions', () => {
            expect(hasPermission(supportUser, PERMISSIONS.RBAC_MANAGE)).toBe(
                  false,
            )
            expect(
                  hasPermission(supportUser, PERMISSIONS.USERS_DELETE_ANY),
            ).toBe(false)
            expect(
                  hasPermission(supportUser, PERMISSIONS.AUDIT_READ_ALL),
            ).toBe(false)
      })

      it('grants compliance role support permissions + audit:read:all + users:read:all', () => {
            expect(
                  hasPermission(complianceUser, PERMISSIONS.AUDIT_READ_ALL),
            ).toBe(true)
            expect(
                  hasPermission(complianceUser, PERMISSIONS.USERS_READ_ALL),
            ).toBe(true)
            expect(
                  hasPermission(complianceUser, PERMISSIONS.AUDIT_READ),
            ).toBe(true)
      })

      it('denies compliance role admin-only permissions', () => {
            expect(
                  hasPermission(complianceUser, PERMISSIONS.RBAC_MANAGE),
            ).toBe(false)
            expect(
                  hasPermission(complianceUser, PERMISSIONS.USERS_DELETE_ANY),
            ).toBe(false)
      })
})

// ---------------------------------------------------------------------------
// Admin Bypass
// ---------------------------------------------------------------------------

describe('admin bypass', () => {
      it('admin has ALL permissions', () => {
            const allPerms = Object.values(PERMISSIONS)
            for (const perm of allPerms) {
                  expect(hasPermission(adminUser, perm)).toBe(true)
            }
      })

      it('admin getUserPermissions returns all permissions', () => {
            const perms = getUserPermissions(adminUser)
            const allPerms = Object.values(PERMISSIONS)
            for (const perm of allPerms) {
                  expect(perms.has(perm)).toBe(true)
            }
      })
})

// ---------------------------------------------------------------------------
// Fail-Closed (Unknown Roles)
// ---------------------------------------------------------------------------

describe('fail-closed for unknown roles', () => {
      it('unknown role has no permissions', () => {
            expect(
                  hasPermission(unknownUser, PERMISSIONS.USERS_READ_SELF),
            ).toBe(false)
            expect(hasPermission(unknownUser, PERMISSIONS.RBAC_MANAGE)).toBe(
                  false,
            )
      })

      it('unknown role getUserPermissions returns empty set', () => {
            const perms = getUserPermissions(unknownUser)
            expect(perms.size).toBe(0)
      })

      it('unknown role fails hasAnyRole', () => {
            expect(hasAnyRole(unknownUser, ['user', 'admin'])).toBe(false)
      })
})

// ---------------------------------------------------------------------------
// hasAllPermissions / hasAnyPermission
// ---------------------------------------------------------------------------

describe('hasAllPermissions', () => {
      it('returns true when user has all specified permissions', () => {
            expect(
                  hasAllPermissions(userUser, [
                        PERMISSIONS.USERS_READ_SELF,
                        PERMISSIONS.USERS_UPDATE_SELF,
                  ]),
            ).toBe(true)
      })

      it('returns false when user lacks any specified permission', () => {
            expect(
                  hasAllPermissions(userUser, [
                        PERMISSIONS.USERS_READ_SELF,
                        PERMISSIONS.AUDIT_READ, // user doesn't have this
                  ]),
            ).toBe(false)
      })

      it('returns true for empty array (vacuous truth)', () => {
            expect(hasAllPermissions(userUser, [])).toBe(true)
      })
})

describe('hasAnyPermission', () => {
      it('returns true when user has any specified permission', () => {
            expect(
                  hasAnyPermission(userUser, [
                        PERMISSIONS.AUDIT_READ, // doesn't have
                        PERMISSIONS.USERS_READ_SELF, // has
                  ]),
            ).toBe(true)
      })

      it('returns false when user has none of the specified permissions', () => {
            expect(
                  hasAnyPermission(userUser, [
                        PERMISSIONS.AUDIT_READ,
                        PERMISSIONS.RBAC_MANAGE,
                  ]),
            ).toBe(false)
      })

      it('returns false for empty array', () => {
            expect(hasAnyPermission(userUser, [])).toBe(false)
      })
})

// ---------------------------------------------------------------------------
// Constants Integrity
// ---------------------------------------------------------------------------

describe('RBAC constants integrity', () => {
      it('has the expected roles', () => {
            expect(ROLES).toEqual(['user', 'admin', 'support', 'compliance'])
      })

      it('every role has a permission mapping', () => {
            for (const role of ROLES) {
                  expect(ROLE_PERMISSIONS[role]).toBeDefined()
                  expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true)
            }
      })

      it('user role only has :self permissions', () => {
            const userPerms = ROLE_PERMISSIONS.user
            for (const perm of userPerms) {
                  expect(perm).toMatch(/:self$/)
            }
      })

      it('admin role has all defined permissions', () => {
            const adminPerms = new Set(ROLE_PERMISSIONS.admin)
            const allPerms = Object.values(PERMISSIONS)
            for (const perm of allPerms) {
                  expect(adminPerms.has(perm)).toBe(true)
            }
      })
})
