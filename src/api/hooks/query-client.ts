/**
 * TanStack QueryClient configuration.
 *
 * Design decisions:
 * - Shared config for SSR hydration and client-side
 * - Global error handler maps API errors to user-facing actions
 * - Conservative defaults for fintech (short stale times for balances)
 * - Retry logic delegated to the retry engine (TanStack retry disabled)
 * - Structural sharing enabled for performance
 */

import { STALE_TIMES } from '@/api/client/config'
import { QueryClient } from '@tanstack/react-query'
import { isApiError, isAuthError, isNetworkError } from '@/api/client/errors'

// ---------------------------------------------------------------------------
// QueryClient Factory
// ---------------------------------------------------------------------------

/**
 * Create a new QueryClient with fintech-tuned defaults.
 *
 * Important: In Next.js App Router, you should create the QueryClient
 * once per request on the server and once per app lifetime on the client.
 * The provider handles this distinction.
 */
export function createQueryClient(): QueryClient {
      return new QueryClient({
            defaultOptions: {
                  queries: {
                        /**
                         * Standard stale time for most queries.
                         * Override per-query for real-time data (balances, transactions).
                         */
                        staleTime: STALE_TIMES.STANDARD,

                        /**
                         * Garbage collection time — how long unused queries stay in cache.
                         * 5 minutes is a good balance between memory and UX.
                         */
                        gcTime: 5 * 60 * 1000,

                        /**
                         * Retry is handled by the retry engine, not TanStack's.
                         * This prevents double-retry logic.
                         */
                        retry: false,

                        /**
                         * Refetch on window focus for stale queries.
                         * Critical for fintech — ensures balances are current
                         * when the user returns to the tab.
                         */
                        refetchOnWindowFocus: 'always',

                        /**
                         * Don't refetch on reconnect — the retry engine handles
                         * network recovery.
                         */
                        refetchOnReconnect: true,

                        /**
                         * Keep previous data while refetching for smoother UX.
                         */
                        placeholderData: (previousData: unknown) =>
                              previousData,
                  },

                  mutations: {
                        /**
                         * Retry is handled by the retry engine.
                         */
                        retry: false,
                  },
            },
      })
}

// ---------------------------------------------------------------------------
// Global Error Handlers
// ---------------------------------------------------------------------------

/**
 * Global query error handler.
 *
 * This handles errors that aren't caught by individual query error handlers.
 * Typically used for auth errors (redirect to login) and network errors
 * (show offline banner).
 *
 * @param onAuthError - Callback when auth fails globally (e.g. redirect to login)
 * @param onNetworkError - Callback when the network is unavailable
 */
export function createGlobalErrorHandler(options: {
      onAuthError?: () => void
      onNetworkError?: () => void
      onUnhandledError?: (error: unknown) => void
}) {
      return (error: unknown): void => {
            if (isAuthError(error)) {
                  options.onAuthError?.()
                  return
            }

            if (isNetworkError(error)) {
                  options.onNetworkError?.()
                  return
            }

            if (isApiError(error)) {
                  // Log but don't crash — individual queries should handle their own errors
                  return
            }

            // Truly unexpected error
            options.onUnhandledError?.(error)
      }
}
