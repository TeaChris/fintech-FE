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
export async function createServerClient(
  overrides?: { baseUrl?: string; timeout?: number },
): Promise<ApiClient> {
  // Read cookies from the incoming request
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  return createApiClient({
    baseUrl: overrides?.baseUrl,
    timeout: overrides?.timeout,
    runtime: 'server',
    defaultHeaders: {
      'Accept': 'application/json',
      'Cookie': cookieHeader,
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
