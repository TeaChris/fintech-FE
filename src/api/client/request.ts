/**
 * Request builder — URL construction, header management, body preparation.
 *
 * Design decisions:
 * - URL interpolation: `/accounts/{id}` → `/accounts/123`
 * - Query strings: handles arrays, booleans, undefined filtering
 * - Header merging: defaults < config < per-request
 * - Body serialization delegated to serialization.ts
 * - Content-Type auto-detection
 * - Edge-compatible (uses URL and URLSearchParams)
 */

import type {
      PathParams,
      QueryParams,
      RequestContext,
} from "@/api/types";
import { serializeBody } from "./serialization";

// ---------------------------------------------------------------------------
// URL Building
// ---------------------------------------------------------------------------

/**
 * Interpolate path parameters into a URL template.
 *
 * Example: `/accounts/{id}/transactions` + `{ id: '123' }`
 *        → `/accounts/123/transactions`
 *
 * @param path - URL path template with `{param}` placeholders
 * @param params - Path parameter values
 * @returns Interpolated URL path
 */
export function interpolatePath(path: string, params?: PathParams): string {
      if (!params) return path;

      let result = path;

      for (const [key, value] of Object.entries(params)) {
            // Use a global regex to replace ALL occurrences of the placeholder,
            // not just the first (which is what String.replace does by default).
            const placeholder = new RegExp(
                  `\\{${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}`,
                  'g',
            );
            result = result.replace(
                  placeholder,
                  encodeURIComponent(String(value)),
            );
      }

      return result;
}


/**
 * Build a query string from a params object.
 *
 * Handles:
 * - String, number, boolean values
 * - Arrays (repeated keys: `status=active&status=pending`)
 * - undefined values are omitted
 * - Empty strings are preserved
 *
 * @param query - Query parameter object
 * @returns URLSearchParams instance
 */
export function buildQueryString(query?: QueryParams): URLSearchParams {
      const params = new URLSearchParams();

      if (!query) return params;

      for (const [key, value] of Object.entries(query)) {
            if (value === undefined) continue;

            if (Array.isArray(value)) {
                  for (const item of value) {
                        params.append(key, String(item));
                  }
            } else {
                  params.append(key, String(value));
            }
      }

      return params;
}

/**
 * Build the full request URL from base URL, path, params, and query.
 *
 * @param baseUrl - API base URL (e.g. 'https://api.example.com')
 * @param path - URL path template (e.g. '/accounts/{id}')
 * @param params - Path parameters for interpolation
 * @param query - Query/search parameters
 * @returns Full URL string
 */
export function buildRequestUrl(
      baseUrl: string,
      path: string,
      params?: PathParams,
      query?: QueryParams,
): string {
      const interpolatedPath = interpolatePath(path, params);
      const queryString = buildQueryString(query);
      const queryPart = queryString.toString();

      // Ensure no double slashes between base and path
      const separator =
            baseUrl.endsWith("/") || interpolatedPath.startsWith("/")
                  ? ""
                  : "/";

      // Remove trailing slash from base if path starts with slash
      const cleanBase =
            baseUrl.endsWith("/") && interpolatedPath.startsWith("/")
                  ? baseUrl.slice(0, -1)
                  : baseUrl;

      const url = `${cleanBase}${separator}${interpolatedPath}`;

      return queryPart ? `${url}?${queryPart}` : url;
}

// ---------------------------------------------------------------------------
// Header Management
// ---------------------------------------------------------------------------

/**
 * Merge headers from multiple sources.
 * Later sources override earlier ones (last-write-wins).
 *
 * @param sources - Header sources to merge (in priority order)
 * @returns Merged headers as a plain object
 */
export function mergeHeaders(
      ...sources: (Record<string, string> | Headers | undefined)[]
): Record<string, string> {
      const result: Record<string, string> = {};

      for (const source of sources) {
            if (!source) continue;

            if (source instanceof Headers) {
                  source.forEach((value, key) => {
                        result[key] = value;
                  });
            } else {
                  Object.assign(result, source);
            }
      }

      return result;
}

/**
 * Convert a HeadersInit (plain object or Headers) to a plain object.
 */
export function normalizeHeaders(
      headers?: Record<string, string> | Headers,
): Record<string, string> {
      if (!headers) return {};

      if (headers instanceof Headers) {
            const result: Record<string, string> = {};
            headers.forEach((value, key) => {
                  result[key] = value;
            });
            return result;
      }

      return { ...headers };
}

// ---------------------------------------------------------------------------
// Request Building
// ---------------------------------------------------------------------------

/**
 * Build a complete RequestInit from the request context.
 *
 * This is the final step before calling `fetch()`.
 * It combines:
 * - Method
 * - Headers (from context, accumulated by middleware)
 * - Body (serialized)
 * - Signal (from timeout controller)
 * - Credentials (always 'include' for cookie-based auth)
 *
 * @param context - The fully-enriched request context
 * @param signal - AbortSignal for cancellation/timeout
 * @returns RequestInit ready for fetch()
 */
export function buildFetchInit(
      context: RequestContext,
      signal: AbortSignal,
): RequestInit {
      const { config, headers } = context;
      const { serialized, contentType } = serializeBody(config.body);

      // Build final headers
      const finalHeaders: Record<string, string> = { ...headers };

      // Set Content-Type if the serializer determined one
      // Don't override if already set (e.g. for FormData, browser sets boundary)
      if (
            contentType &&
            !finalHeaders["Content-Type"] &&
            !finalHeaders["content-type"]
      ) {
            finalHeaders["Content-Type"] = contentType;
      }

      // Merge per-request headers (highest priority)
      if (config.headers) {
            const perRequestHeaders = normalizeHeaders(
                  config.headers as Record<string, string> | Headers,
            );
            Object.assign(finalHeaders, perRequestHeaders);
      }

      const init: RequestInit = {
            method: config.method,
            headers: finalHeaders,
            signal,
            credentials: "include" as RequestCredentials, // Always send cookies
      };

      // Only attach body for methods that support it
      if (
            serialized !== null &&
            config.method !== "GET" &&
            config.method !== "DELETE"
      ) {
            init.body = serialized;
      }

      return init;
}
