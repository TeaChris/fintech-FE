import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next.js middleware — sets security headers on all responses.
 *
 * These headers provide defense-in-depth against common web attacks:
 * - CSP: Prevents XSS and data injection
 * - X-Frame-Options: Prevents clickjacking
 * - HSTS: Enforces HTTPS
 * - X-Content-Type-Options: Prevents MIME sniffing
 * - Referrer-Policy: Controls referrer leakage
 * - Permissions-Policy: Restricts browser APIs
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Prevent clickjacking — this is a fintech app, never embed in iframes
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Control referrer information leakage
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Enforce HTTPS (2 years, include subdomains)
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload',
  );

  // Restrict browser features — fintech app doesn't need camera/mic/geo
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(self)',
  );

  // Content Security Policy — strict but practical
  // Start with report-only if needed, then enforce
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline/eval in dev
    "style-src 'self' 'unsafe-inline'", // Tailwind injects inline styles
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self' " + (process.env.NEXT_PUBLIC_API_BASE_URL ?? ''),
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export const config = {
  // Match all paths except static files and Next.js internals
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
