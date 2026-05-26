/**
 * Auth refresh coordinator with singleton pattern.
 *
 * Design decisions:
 * - Singleton refresh: only ONE refresh request at a time
 * - All concurrent 401s queue behind the single refresh
 * - After refresh, all queued requests retry automatically
 * - Race prevention via promise-based mutex
 * - CSRF token extracted from cookies (double-submit pattern)
 * - No localStorage — tokens live in httpOnly cookies only
 * - SSR-safe: server-side reads cookies from `next/headers`
 * - Configurable auth failure callback (e.g. redirect to login)
 */

import type { AuthConfig, HttpMethod } from "@/api/types";
import { AuthError } from "./errors";
import { DEFAULT_AUTH_CONFIG } from "./config";

// ---------------------------------------------------------------------------
// CSRF Token Extraction
// ---------------------------------------------------------------------------

/**
 * Extract the CSRF token from cookies (browser-only).
 *
 * Reads the value of the CSRF cookie (default: `XSRF-TOKEN`).
 * This cookie is set by the backend as a non-httpOnly cookie
 * specifically so the frontend can read it for the double-submit pattern.
 *
 * Returns `undefined` on server/edge (cookies are forwarded differently).
 */
export function extractCsrfToken(cookieName: string): string | undefined {
      if (typeof document === "undefined") {
            return undefined;
      }

      const cookies = document.cookie.split(";");
      let token: string | undefined;

      for (const cookie of cookies) {
            const [name, ...valueParts] = cookie.trim().split("=");
            if (name === cookieName) {
                  const value = decodeURIComponent(valueParts.join("="));
                  // Use the LAST matching cookie. Browsers list host-only
                  // cookies before domain cookies, so the last match is
                  // the most specific (host-only) cookie — reducing the
                  // impact of cookie-tossing attacks from sibling subdomains.
                  token = value;
            }
      }

      // Basic sanity check: CSRF tokens should be non-empty and reasonably sized
      if (token && (token.length < 8 || token.length > 512)) {
            return undefined;
      }

      return token;
}

// ---------------------------------------------------------------------------
// Auth State
// ---------------------------------------------------------------------------

/**
 * Internal auth state managed by the coordinator.
 * NOT exported — only the coordinator functions are public.
 */
interface AuthState {
      /** Whether a refresh is currently in progress */
      refreshInProgress: boolean;

      /**
       * The refresh promise.
       * All concurrent 401 handlers await this same promise.
       */
      refreshPromise: Promise<boolean> | null;

      /** Count of consecutive refresh failures */
      consecutiveFailures: number;

      /** Maximum consecutive failures before giving up */
      maxConsecutiveFailures: number;
}

// ---------------------------------------------------------------------------
// Auth Coordinator
// ---------------------------------------------------------------------------

/**
 * Public interface of the auth coordinator.
 *
 * Usage:
 * ```ts
 * const auth = createAuthCoordinator(config);
 *
 * // In the fetch wrapper, when a 401 is received:
 * const refreshed = await auth.handleUnauthorized();
 * if (refreshed) {
 *   // Retry the original request
 * }
 * ```
 */
export interface AuthCoordinator {
      /**
       * Handle a 401 response.
       * If a refresh is already in progress, queues behind it.
       * Returns `true` if refresh succeeded and the request should be retried.
       * Returns `false` if refresh failed (caller should throw AuthError).
       */
      handleUnauthorized(): Promise<boolean>;

      /**
       * Build auth-related headers for a request.
       * Includes CSRF token for non-GET requests.
       */
      buildAuthHeaders(method: HttpMethod): Record<string, string>;

      /**
       * Check if a path is public (doesn't require auth).
       */
      isPublicPath(path: string): boolean;

      /**
       * Reset the auth state (e.g. on logout).
       */
      reset(): void;
}

/**
 * Create an auth coordinator instance.
 *
 * The coordinator manages the token refresh lifecycle:
 * 1. First 401 triggers a refresh request
 * 2. Subsequent 401s queue behind the same refresh
 * 3. On success: all queued requests retry
 * 4. On failure: all queued requests get AuthError
 *
 * @param config - Auth configuration
 * @param refreshFn - Function that performs the actual refresh request.
 *   Should return `true` on success, `false` on failure.
 *   This is injected to avoid circular dependencies with the fetcher.
 */
export function createAuthCoordinator(
      config: AuthConfig = DEFAULT_AUTH_CONFIG,
      refreshFn?: () => Promise<boolean>,
): AuthCoordinator {
      const state: AuthState = {
            refreshInProgress: false,
            refreshPromise: null,
            consecutiveFailures: 0,
            maxConsecutiveFailures: 3,
      };

      /**
       * The internal refresh function.
       * Can be set later via `setRefreshFn` to break circular dependencies.
       */
      const performRefresh: (() => Promise<boolean>) | undefined = refreshFn;

      /**
       * Execute the token refresh.
       * This is the actual refresh logic — only called once per refresh cycle.
       */
      async function executeRefresh(): Promise<boolean> {
            if (!performRefresh) {
                  // No refresh function configured — cannot refresh
                  return false;
            }

            try {
                  const success = await performRefresh();

                  if (success) {
                        state.consecutiveFailures = 0;
                        return true;
                  }

                  state.consecutiveFailures++;
                  return false;
            } catch {
                  state.consecutiveFailures++;
                  return false;
            }
      }

      return {
            handleUnauthorized: async (): Promise<boolean> => {
                  // If we've failed too many times, don't even try
                  if (
                        state.consecutiveFailures >=
                        state.maxConsecutiveFailures
                  ) {
                        config.onAuthFailure?.();
                        return false;
                  }

                  // If a refresh is already in progress, queue behind it
                  if (state.refreshInProgress && state.refreshPromise) {
                        return state.refreshPromise;
                  }

                  // Start a new refresh
                  state.refreshInProgress = true;
                  state.refreshPromise = executeRefresh().finally(() => {
                        state.refreshInProgress = false;
                        state.refreshPromise = null;
                  });

                  const result = await state.refreshPromise;

                  if (!result) {
                        config.onAuthFailure?.();
                  }

                  return result;
            },

            buildAuthHeaders: (method: HttpMethod): Record<string, string> => {
                  const headers: Record<string, string> = {};

                  // CSRF token for non-GET requests (double-submit pattern)
                  if (method !== "GET") {
                        const csrfToken = extractCsrfToken(
                              config.csrfCookieName,
                        );
                        if (csrfToken) {
                              headers[config.csrfHeaderName] = csrfToken;
                        }
                  }

                  // Auth tokens are in httpOnly cookies — automatically sent by the browser.
                  // We don't need to manually attach them.
                  // On the server, cookies are forwarded by the server fetcher.

                  return headers;
            },

            isPublicPath: (path: string): boolean => {
                  return config.publicPaths.some((publicPath) => {
                        // Exact match
                        if (path === publicPath) return true;

                        // Prefix match with trailing wildcard
                        if (publicPath.endsWith("*")) {
                              return path.startsWith(publicPath.slice(0, -1));
                        }

                        return false;
                  });
            },

            reset: (): void => {
                  state.refreshInProgress = false;
                  state.refreshPromise = null;
                  state.consecutiveFailures = 0;
            },
      };
}

/**
 * Create a refresh function that calls the refresh endpoint.
 *
 * This is separated from createAuthCoordinator to break the
 * circular dependency between the auth coordinator and the fetcher.
 * The fetcher creates this function and passes it to the coordinator.
 *
 * @param baseUrl - API base URL
 * @param config - Auth configuration
 * @returns A function that performs the refresh request
 */
export function createRefreshFn(
      baseUrl: string,
      config: AuthConfig,
): () => Promise<boolean> {
      return async (): Promise<boolean> => {
            try {
                  const url = `${baseUrl}${config.refreshEndpoint}`;
                  const csrfToken = extractCsrfToken(config.csrfCookieName);

                  const headers: Record<string, string> = {
                        "Content-Type": "application/json",
                  };

                  if (csrfToken) {
                        headers[config.csrfHeaderName] = csrfToken;
                  }

                  const response = await fetch(url, {
                        method: config.refreshMethod,
                        headers,
                        credentials: "include", // Send httpOnly cookies
                  });

                  return response.ok;
            } catch {
                  return false;
            }
      };
}

/**
 * Determine if a 401 error should trigger the auth refresh flow.
 *
 * NOT triggered for:
 * - The refresh endpoint itself (prevents infinite loops)
 * - Public paths that shouldn't have auth
 */
/**
 * Check if a path is public (doesn't require auth).
 * Standalone version — no coordinator needed.
 */
export function isPublicPath(path: string, config: AuthConfig): boolean {
      return config.publicPaths.some((publicPath) => {
            if (path === publicPath) return true;
            if (publicPath.endsWith('*')) {
                  return path.startsWith(publicPath.slice(0, -1));
            }
            return false;
      });
}

export function shouldAttemptRefresh(
      path: string,
      config: AuthConfig,
): boolean {
      // Never try to refresh the refresh endpoint itself
      if (
            path === config.refreshEndpoint ||
            path.endsWith(config.refreshEndpoint)
      ) {
            return false;
      }

      // Don't refresh for public paths
      if (isPublicPath(path, config)) {
            return false;
      }

      return true;
}

/**
 * Create an AuthError with appropriate metadata.
 * Used when refresh fails and the original request cannot be retried.
 */
export function createAuthError(
      message: string,
      context: {
            requestId: string;
            correlationId: string;
            method: HttpMethod;
            url: string;
            durationMs: number;
            retryCount: number;
      },
): AuthError {
      return new AuthError(message, {
            status: 401,
            requestId: context.requestId,
            correlationId: context.correlationId,
            method: context.method,
            url: context.url,
            retryable: false,
            retryCount: context.retryCount,
            durationMs: context.durationMs,
            timestamp: new Date().toISOString(),
      });
}
