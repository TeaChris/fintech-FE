/**
 * Idempotency key generation for mutation safety.
 *
 * Design decisions:
 * - Uses crypto.randomUUID() (Edge-safe, no dependencies)
 * - Keys are generated per-mutation, not per-retry
 *   (same key is reused across retries of the same mutation)
 * - Header name follows the IETF draft standard: `Idempotency-Key`
 * - Only applied to state-changing methods (POST, PUT, PATCH)
 * - GET and DELETE are inherently idempotent and don't need keys
 */

import type { HttpMethod } from '@/api/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Standard idempotency key header name */
export const IDEMPOTENCY_KEY_HEADER = 'Idempotency-Key';

/** HTTP methods that require idempotency keys */
const METHODS_REQUIRING_IDEMPOTENCY: ReadonlySet<HttpMethod> = new Set([
  'POST',
  'PUT',
  'PATCH',
]);

// ---------------------------------------------------------------------------
// Key Generation
// ---------------------------------------------------------------------------

/**
 * Generate a new idempotency key.
 *
 * Format: `idem-{uuid}`
 * Prefixed for easy identification in logs and debugging.
 */
export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `idem-${crypto.randomUUID()}`;
  }

  // Fallback
  return `idem-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

// ---------------------------------------------------------------------------
// Key Management
// ---------------------------------------------------------------------------

/**
 * Determine whether a request method requires an idempotency key.
 */
export function requiresIdempotencyKey(method: HttpMethod): boolean {
  return METHODS_REQUIRING_IDEMPOTENCY.has(method);
}

/**
 * Resolve the idempotency key for a request.
 *
 * Priority:
 * 1. Explicit key provided by the caller
 * 2. Auto-generated key for applicable methods
 * 3. undefined for methods that don't need one
 */
export function resolveIdempotencyKey(
  method: HttpMethod,
  explicitKey?: string,
): string | undefined {
  // If the caller explicitly provided a key, always use it
  if (explicitKey) {
    return explicitKey;
  }

  // Auto-generate for applicable methods
  if (requiresIdempotencyKey(method)) {
    return generateIdempotencyKey();
  }

  return undefined;
}

/**
 * Build the idempotency header if a key is present.
 * Returns an empty object if no key is needed.
 */
export function buildIdempotencyHeader(
  key: string | undefined,
): Record<string, string> {
  if (!key) {
    return {};
  }

  return { [IDEMPOTENCY_KEY_HEADER]: key };
}
