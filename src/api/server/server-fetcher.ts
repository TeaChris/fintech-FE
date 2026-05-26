/**
 * Server-side API fetcher for SSR and Server Components.
 *
 * Design decisions:
 * - Uses `server-only` to prevent accidental client-side import
 * - Reads cookies from `next/headers` for auth forwarding
 * - Compatible with React `cache()` for request deduplication
 * - Creates a fresh client per-request (no shared state between requests)
 * - Edge and Node.js runtime compatible
 */

import 'server-only';

import { cookies } from 'next/headers';
import { createApiClient } from '@/api/client';
import type { ApiClient } from '@/api/types';

// ---------------------------------------------------------------------------
// Server Client Factory
// ---------------------------------------------------------------------------

/**
 * Create a server-side API client that forwards cookies from the
 * incoming request to the API backend.
 *
 * IMPORTANT: Call this inside Server Components, Server Actions,
 * or Route Handlers — never in client components.
 *
 * @example
 * ```tsx
 * // In a Server Component
 * import { createServerClient } from '@/api/server';
 *
 * export default async function AccountPage({ params }) {
 *   const client = await createServerClient();
 *   const { data: account } = await client.get('/accounts/{id}', {
 *     params: { id: params.id },
 *     schema: AccountSchema,
 *   });
 *
 *   return <AccountDetails account={account} />;
 * }
 * ```
 */
/**
 * Cookies that are safe to forward to the API backend.
 * Only these cookies will be included in server-side requests.
 */
const ALLOWED_COOKIE_NAMES: ReadonlySet<string> = new Set([
  'access_token',
  'refresh_token',
  'session_id',
  'XSRF-TOKEN',
]);

/**
 * Validate that the target base URL is a trusted first-party domain.
 * Prevents accidental credential leakage to third-party APIs.
 *
 * Returns true if:
 * - No override is provided (uses default API_BASE_URL)
 * - The override matches the configured API_BASE_URL origin
 * - The override is a relative URL
 */
function isTrustedBaseUrl(overrideUrl?: string): boolean {
  if (!overrideUrl) return true;

  // Relative URLs are safe (same origin)
  if (overrideUrl.startsWith('/')) return true;

  const configuredBase =
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    '';

  if (!configuredBase) return false;

  try {
    const configuredOrigin = new URL(configuredBase).origin;
    const overrideOrigin = new URL(overrideUrl).origin;
    return configuredOrigin === overrideOrigin;
  } catch {
    return false;
  }
}

export async function createServerClient(
  overrides?: { baseUrl?: string; timeout?: number },
): Promise<ApiClient> {
  // Read cookies from the incoming request
  const cookieStore = await cookies();

  // Only forward allowed cookies, and only to trusted domains
  const trusted = isTrustedBaseUrl(overrides?.baseUrl);
  const cookieHeader = cookieStore
    .getAll()
    .filter((c) => trusted && ALLOWED_COOKIE_NAMES.has(c.name))
    .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
    .join('; ');

  return createApiClient({
    baseUrl: overrides?.baseUrl,
    timeout: overrides?.timeout,
    runtime: 'server',
    defaultHeaders: {
      'Accept': 'application/json',
      ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
    },
  });
}

// ---------------------------------------------------------------------------
// Cached Server Client (request deduplication)
// ---------------------------------------------------------------------------

/**
 * Create a cached server client using React's `cache()`.
 *
 * This ensures that multiple Server Components calling the same
 * API endpoint within a single request share the same fetch.
 *
 * @example
 * ```tsx
 * import { getCachedServerClient } from '@/api/server';
 *
 * // Both calls within the same request share the client
 * const client = await getCachedServerClient();
 * ```
 */
import { cache } from 'react';

export const getCachedServerClient = cache(async (): Promise<ApiClient> => {
  return createServerClient();
});
