/**
 * Environment-aware API client configuration.
 *
 * Provides sensible defaults for browser, SSR, and Edge runtimes.
 * Configuration is built via a factory function to support DI
 * and environment-specific overrides.
 *
 * Design decisions:
 * - Server-side uses `API_BASE_URL` (private, not exposed to client)
 * - Client-side uses `NEXT_PUBLIC_API_BASE_URL` (safe to expose)
 * - Runtime is auto-detected but can be overridden
 * - All defaults are conservative (long timeouts, limited retries)
 */

import type { ApiClientConfig, AuthConfig, RetryConfig } from "@/api/types";

// ---------------------------------------------------------------------------
// Runtime Detection
// ---------------------------------------------------------------------------

type RuntimeEnvironment = "browser" | "server" | "edge";

/**
 * Detect the current runtime environment.
 * Edge runtime is identified by the NEXT_RUNTIME env var.
 */
export function detectRuntime(): RuntimeEnvironment {
      if (typeof window !== "undefined") {
            return "browser";
      }

      // Next.js sets this in Edge runtime contexts
      if (
            typeof process !== "undefined" &&
            process.env.NEXT_RUNTIME === "edge"
      ) {
            return "edge";
      }

      return "server";
}

// ---------------------------------------------------------------------------
// Base URL Resolution
// ---------------------------------------------------------------------------

/**
 * Resolve the API base URL based on runtime environment.
 *
 * - Server/Edge: uses `API_BASE_URL` (private env var)
 * - Browser: uses `NEXT_PUBLIC_API_BASE_URL` (public env var)
 *
 * Falls back to empty string if neither is set, which will cause
 * requests to be relative to the current origin.
 */
export function resolveBaseUrl(runtime: RuntimeEnvironment): string {
      if (runtime === "browser") {
            return process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
      }

      // Server and Edge can access private env vars
      return (
            process.env.API_BASE_URL ??
            process.env.NEXT_PUBLIC_API_BASE_URL ??
            ""
      );
}

// ---------------------------------------------------------------------------
// Default Configurations
// ---------------------------------------------------------------------------

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30_000,
      jitterFactor: 0.3,
      retryOnNetworkError: true,
      retryableStatuses: [408, 429, 500, 502, 503, 504],
} as const;

export const DEFAULT_AUTH_CONFIG: AuthConfig = {
      refreshMethod: "POST",
      csrfCookieName: "XSRF-TOKEN",
      csrfHeaderName: "X-XSRF-TOKEN",
      refreshEndpoint: "/auth/refresh",
      publicPaths: ["/auth/login", "/auth/register", "/auth/forgot-password"],
      onAuthFailure: undefined,
} as const;

export const DEFAULT_TIMEOUT_MS = 30_000;

// ---------------------------------------------------------------------------
// Configuration Factory
// ---------------------------------------------------------------------------

/**
 * Create a complete API client configuration by merging
 * provided overrides with environment-aware defaults.
 */
export function createApiClientConfig(
      overrides: Partial<ApiClientConfig> = {},
): ApiClientConfig {
      const runtime = overrides.runtime ?? detectRuntime();
      const baseUrl = overrides.baseUrl ?? resolveBaseUrl(runtime);

      return {
            baseUrl,
            timeout: overrides.timeout ?? DEFAULT_TIMEOUT_MS,
            retry: {
                  ...DEFAULT_RETRY_CONFIG,
                  ...overrides.retry,
            },
            auth: {
                  ...DEFAULT_AUTH_CONFIG,
                  ...overrides.auth,
            },
            middleware: overrides.middleware ?? [],
            logger: overrides.logger,
            defaultHeaders: {
                  Accept: "application/json",
                  ...overrides.defaultHeaders,
            },
            runtime,
      };
}

// ---------------------------------------------------------------------------
// Stale Time Presets (for TanStack Query)
// ---------------------------------------------------------------------------

/**
 * Recommended stale-time presets for different data categories.
 *
 * Financial data should be fresh; reference data can be cached longer.
 */
export const STALE_TIMES = {
      /** Real-time data: balances, transaction status. 0 = always refetch. */
      REALTIME: 0,

      /** Frequently changing: transaction lists, notifications. 30s. */
      FREQUENT: 30_000,

      /** Standard: account details, user profile. 2 minutes. */
      STANDARD: 2 * 60 * 1_000,

      /** Reference data: currencies, bank lists, card types. 10 minutes. */
      REFERENCE: 10 * 60 * 1_000,

      /** Static data: feature flags, app config. 30 minutes. */
      STATIC: 30 * 60 * 1_000,
} as const;
