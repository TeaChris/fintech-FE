/**
 * Tests for route protection logic.
 *
 * Tests the pure functions from auth.config.ts that drive
 * both middleware and layout-level route protection.
 */

import { describe, it, expect } from 'vitest'
import {
      isPublicRoute,
      isAuthPage,
      PUBLIC_ROUTES,
      SESSION_COOKIE_NAME,
      SIGN_IN_PATH,
      DEFAULT_AUTHENTICATED_PATH,
} from '../auth.config'

// ---------------------------------------------------------------------------
// isPublicRoute
// ---------------------------------------------------------------------------

describe('isPublicRoute', () => {
      it('treats "/" as public (landing page)', () => {
            expect(isPublicRoute('/')).toBe(true)
      })

      it.each([
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
            '/terms',
            '/privacy',
      ])('treats "%s" as public', (route) => {
            expect(isPublicRoute(route)).toBe(true)
      })

      it('treats sub-paths of public routes as public', () => {
            expect(isPublicRoute('/sign-in/callback')).toBe(true)
            expect(isPublicRoute('/mfa/setup')).toBe(true)
            expect(isPublicRoute('/verify-email/confirm')).toBe(true)
      })

      it.each([
            '/dashboard',
            '/accounts',
            '/transactions',
            '/transfers',
            '/settings',
            '/profile',
            '/notifications',
      ])('treats "%s" as protected', (route) => {
            expect(isPublicRoute(route)).toBe(false)
      })

      it('treats sub-paths of protected routes as protected', () => {
            expect(isPublicRoute('/dashboard/overview')).toBe(false)
            expect(isPublicRoute('/accounts/acc_001')).toBe(false)
            expect(isPublicRoute('/settings/security')).toBe(false)
      })

      it('does not match partial prefix collisions', () => {
            // "/sign-in" should not match "/sign-info" (no trailing slash)
            expect(isPublicRoute('/sign-info')).toBe(false)
            expect(isPublicRoute('/mfa-setup')).toBe(false)
      })
})

// ---------------------------------------------------------------------------
// isAuthPage
// ---------------------------------------------------------------------------

describe('isAuthPage', () => {
      it('identifies sign-in as an auth page', () => {
            expect(isAuthPage('/sign-in')).toBe(true)
      })

      it('identifies sign-up as an auth page', () => {
            expect(isAuthPage('/sign-up')).toBe(true)
      })

      it('does not treat other public routes as auth pages', () => {
            expect(isAuthPage('/verify-email')).toBe(false)
            expect(isAuthPage('/forgot-password')).toBe(false)
            expect(isAuthPage('/mfa')).toBe(false)
      })

      it('does not treat protected routes as auth pages', () => {
            expect(isAuthPage('/dashboard')).toBe(false)
            expect(isAuthPage('/settings')).toBe(false)
      })
})

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('auth config constants', () => {
      it('has the correct session cookie name', () => {
            expect(SESSION_COOKIE_NAME).toBe('access_token')
      })

      it('has the correct sign-in path', () => {
            expect(SIGN_IN_PATH).toBe('/sign-in')
      })

      it('has the correct default authenticated path', () => {
            expect(DEFAULT_AUTHENTICATED_PATH).toBe('/dashboard')
      })

      it('has at least the core auth routes as public', () => {
            expect(PUBLIC_ROUTES).toContain('/sign-in')
            expect(PUBLIC_ROUTES).toContain('/sign-up')
            expect(PUBLIC_ROUTES).toContain('/verify-email')
            expect(PUBLIC_ROUTES).toContain('/forgot-password')
            expect(PUBLIC_ROUTES).toContain('/reset-password')
      })

      it('does not include protected routes in public routes', () => {
            expect(PUBLIC_ROUTES).not.toContain('/dashboard')
            expect(PUBLIC_ROUTES).not.toContain('/accounts')
            expect(PUBLIC_ROUTES).not.toContain('/settings')
      })
})
