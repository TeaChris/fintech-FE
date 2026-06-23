import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
      isAuthPage,
      SIGN_IN_PATH,
      isPublicRoute,
      SESSION_COOKIE_NAME,
      DEFAULT_AUTHENTICATED_PATH,
} from '@/features/auth/auth.config'

/**
 * Next.js middleware — route protection + security headers.
 *
 * Enforcement layers (defense in depth):
 * 1. Middleware (this file) — fast cookie-presence gate, no network call
 * 2. Authenticated layout — server-side GET /auth/me validation
 * 3. Server actions — requireAuth() guard before mutations
 * 4. API backend — validates cookie on every request
 *
 * The middleware checks for cookie PRESENCE only, not validity.
 * This keeps it fast (no async backend call) while the layout
 * handles full token validation server-side.
 */
export function middleware(request: NextRequest) {
      const { pathname } = request.nextUrl
      const hasSession = request.cookies.has(SESSION_COOKIE_NAME)

      // ── Route Protection ──────────────────────────────────────────

      // 1. Authenticated user visiting auth pages → redirect to dashboard
      if (hasSession && isAuthPage(pathname)) {
            const url = request.nextUrl.clone()
            url.pathname = DEFAULT_AUTHENTICATED_PATH
            url.search = ''
            return NextResponse.redirect(url)
      }

      // 2. Unauthenticated user visiting protected route → redirect to sign-in
      if (!hasSession && !isPublicRoute(pathname)) {
            const url = request.nextUrl.clone()
            url.pathname = SIGN_IN_PATH
            // Preserve the original destination so we can redirect back after login
            url.searchParams.set('redirect', pathname)
            return NextResponse.redirect(url)
      }

      // ── Security Headers ──────────────────────────────────────────

      const response = NextResponse.next()

      // Prevent clickjacking — this is a fintech app, never embed in iframes
      response.headers.set('X-Frame-Options', 'DENY')

      // Prevent MIME type sniffing
      response.headers.set('X-Content-Type-Options', 'nosniff')

      // Control referrer information leakage
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

      // Enforce HTTPS (2 years, include subdomains)
      response.headers.set(
            'Strict-Transport-Security',
            'max-age=63072000; includeSubDomains; preload',
      )

      // Restrict browser features — fintech app doesn't need camera/mic/geo
      response.headers.set(
            'Permissions-Policy',
            'camera=(), microphone=(), geolocation=(), payment=(self)',
      )

      // Content Security Policy — strict but practical
      // Start with report-only if needed, then enforce
      const csp = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline/eval in dev
            "style-src 'self' 'unsafe-inline'", // Tailwind injects inline styles
            "img-src 'self' data: blob:",
            "font-src 'self'",
            "connect-src 'self' " +
                  (process.env.NEXT_PUBLIC_API_BASE_URL ?? ''),
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "object-src 'none'",
      ].join('; ')

      response.headers.set('Content-Security-Policy', csp)

      return response
}

export const config = {
      // Match all paths except static files and Next.js internals
      matcher: [
            '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
      ],
}
