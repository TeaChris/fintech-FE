/**
 * Core API client — the orchestrator that ties everything together.
 *
 * This is the main entry point for making API requests.
 * It composes:
 * - Middleware pipeline (tracing, auth, CSRF, idempotency, logging)
 * - Timeout management (AbortController)
 * - Retry engine (exponential backoff with jitter)
 * - Auth refresh coordination (singleton pattern)
 * - Response parsing (JSON, Blob, Stream, text)
 * - Zod validation (runtime type safety)
 * - Error mapping (domain-specific errors)
 * - Request deduplication (GET only)
 *
 * Design decisions:
 * - Factory function (not class) for better tree-shaking
 * - Generic methods for full type inference
 * - Composable — each concern is independently testable
 * - No global state — each client instance is isolated
 * - Edge-compatible (no Node.js-specific APIs)
 */

import type {
      ApiClient,
      ApiResponse,
      RequestContext,
      ApiClientConfig,
      ApiRequestConfig,
} from '@/api/types'

import {
      mapResponseToError,
      NetworkError,
      // isAuthError,
} from './errors'

import {
      getTimestamp,
      generateRequestId,
      calculateDuration,
      generateCorrelationId,
} from './tracing'

import {
      createRefreshFn,
      shouldAttemptRefresh,
      createAuthCoordinator,
} from './auth'

import { noopLogger } from './logging'
import { executeWithRetry } from './retry'
import { buildApiResponse } from './response'
import { createApiClientConfig } from './config'
import { createTimeoutController } from './timeout'
import { resolveIdempotencyKey } from './idempotency'
import { buildRequestUrl, buildFetchInit } from './request'
import { composeMiddleware, buildMiddlewarePipeline } from './middleware'

// ---------------------------------------------------------------------------
// Request Deduplication
// ---------------------------------------------------------------------------

/**
 * In-flight GET request cache for deduplication.
 * If the same GET URL is requested multiple times simultaneously,
 * only one actual fetch is made and all callers share the result.
 */
type InflightCache = Map<string, Promise<Response>>

function createInflightCache(): InflightCache {
      return new Map()
}

/**
 * Generate a deduplication key for a GET request.
 * Based on method + URL (query params included).
 */
function dedupeKey(method: string, url: string): string {
      return `${method}:${url}`
}

// ---------------------------------------------------------------------------
// API Client Factory
// ---------------------------------------------------------------------------

/**
 * Create an API client instance.
 *
 * This is the primary factory function for the SDK.
 * Each client is fully isolated with its own config, auth state,
 * middleware pipeline, and dedup cache.
 *
 * @param overrides - Partial config overrides (merged with defaults)
 * @returns Fully configured ApiClient
 *
 * @example
 * ```ts
 * const client = createApiClient({
 *   baseUrl: 'https://api.example.com',
 *   timeout: 15000,
 *   retry: { maxRetries: 2 },
 * });
 *
 * const { data } = await client.get<Account>('/accounts/123', {
 *   schema: AccountSchema,
 * });
 * ```
 */
export function createApiClient(
      overrides: Partial<ApiClientConfig> = {},
): ApiClient {
      // Build configuration
      const config = createApiClientConfig(overrides)
      const logger = config.logger ?? noopLogger

      // Create auth coordinator
      const refreshFn = createRefreshFn(config.baseUrl, config.auth)
      const authCoordinator = createAuthCoordinator(config.auth, refreshFn)

      // Build middleware pipeline
      const middlewares = buildMiddlewarePipeline(config, authCoordinator)

      // Deduplication cache for in-flight GET requests
      const inflightCache = createInflightCache()

      // -------------------------------------------------------------------------
      // Core Request Executor
      // -------------------------------------------------------------------------

      /**
       * Execute a single API request through the full pipeline.
       *
       * Pipeline order:
       * 1. Build request context (IDs, timestamps)
       * 2. Run middleware pipeline (tracing, auth, CSRF, idempotency, logging)
       * 3. Build fetch URL and RequestInit
       * 4. Create timeout controller
       * 5. Execute fetch (with deduplication for GETs)
       * 6. Handle non-2xx responses (error mapping, auth refresh)
       * 7. Parse response body (JSON, Blob, Stream, text)
       * 8. Validate with Zod (if schema provided)
       * 9. Return normalized ApiResponse
       */
      async function executeRequest<TData>(
            requestConfig: ApiRequestConfig,
      ): Promise<ApiResponse<TData>> {
            const correlationId = generateCorrelationId()
            const startTime = getTimestamp()

            // Pre-generate idempotency key outside the retry loop.
            // This ensures the SAME key is reused across all retry attempts,
            // preventing duplicate mutations on the server.
            const idempotencyKey = resolveIdempotencyKey(
                  requestConfig.method,
                  requestConfig.idempotencyKey,
            )

            // Wrap in retry engine
            return executeWithRetry(
                  async (attempt) => {
                        const requestId = generateRequestId()

                        // Build request context
                        const context: RequestContext = {
                              requestId,
                              correlationId,
                              startTime,
                              attempt,
                              config: requestConfig,
                              headers: {},
                              metadata: {
                                    ...(idempotencyKey
                                          ? { idempotencyKey }
                                          : {}),
                              },
                        }

                        // Build the full URL
                        const url = buildRequestUrl(
                              config.baseUrl,
                              requestConfig.path,
                              requestConfig.params,
                              requestConfig.query,
                        )

                        // Create timeout controller
                        const timeout = createTimeoutController(
                              requestConfig.timeout ?? config.timeout,
                              requestConfig.signal,
                        )

                        try {
                              // Build the middleware pipeline with the fetch as the terminal handler
                              const pipeline = composeMiddleware(
                                    middlewares,
                                    async (ctx: RequestContext) => {
                                          // Build the final RequestInit
                                          const init = buildFetchInit(
                                                ctx,
                                                timeout.signal,
                                          )

                                          // Deduplication for GET requests
                                          if (requestConfig.method === 'GET') {
                                                const key = dedupeKey(
                                                      'GET',
                                                      url,
                                                )
                                                const inflight =
                                                      inflightCache.get(key)

                                                if (inflight) {
                                                      // Clone the response so each caller gets their own body
                                                      return (
                                                            await inflight
                                                      ).clone()
                                                }

                                                const fetchPromise = fetch(
                                                      url,
                                                      init,
                                                ).finally(() => {
                                                      inflightCache.delete(key)
                                                })

                                                inflightCache.set(
                                                      key,
                                                      fetchPromise,
                                                )
                                                return fetchPromise
                                          }

                                          return fetch(url, init)
                                    },
                              )

                              // Execute the pipeline
                              const response = await pipeline(context)

                              // Clear timeout on successful response
                              timeout.clear()

                              // Calculate duration
                              const durationMs = calculateDuration(startTime)

                              // Handle non-2xx responses
                              if (!response.ok) {
                                    const errorContext = {
                                          requestId,
                                          correlationId,
                                          method: requestConfig.method,
                                          url,
                                          retryCount: attempt,
                                          durationMs,
                                    }

                                    // Check for 401 and attempt auth refresh
                                    if (
                                          response.status === 401 &&
                                          shouldAttemptRefresh(
                                                requestConfig.path,
                                                config.auth,
                                          )
                                    ) {
                                          const refreshed =
                                                await authCoordinator.handleUnauthorized()
                                          if (refreshed) {
                                                // Auth refreshed — re-execute the request directly.
                                                // We bypass the retry engine because AuthError is not retryable
                                                // by design (prevents infinite refresh loops).
                                                return executeRequest<TData>(
                                                      requestConfig,
                                                )
                                          }
                                    }

                                    // Map to domain error and throw
                                    throw await mapResponseToError(
                                          response,
                                          errorContext,
                                    )
                              }

                              // Build and return the normalized response
                              return buildApiResponse<TData>(
                                    response,
                                    requestConfig.schema as
                                          | import('zod').ZodType<TData>
                                          | undefined,
                                    requestConfig.responseType,
                                    {
                                          requestId,
                                          correlationId,
                                          startTime,
                                          attempt,
                                          url,
                                          method: requestConfig.method,
                                          durationMs,
                                    },
                              )
                        } catch (error) {
                              timeout.clear()

                              // Wrap raw fetch errors as NetworkError
                              if (
                                    error instanceof TypeError &&
                                    (error.message.includes('fetch') ||
                                          error.message.includes('network') ||
                                          error.message.includes('Failed'))
                              ) {
                                    throw new NetworkError(
                                          `Network error: ${error.message}`,
                                          {
                                                requestId: context.requestId,
                                                correlationId:
                                                      context.correlationId,
                                                method: requestConfig.method,
                                                url,
                                                retryCount: attempt,
                                                durationMs:
                                                      calculateDuration(
                                                            startTime,
                                                      ),
                                          },
                                    )
                              }

                              throw error
                        }
                  },
                  requestConfig.retry ?? config.retry,
                  {
                        method: requestConfig.method,
                        signal: requestConfig.signal,
                        isFinancialMutation: requestConfig.isFinancialMutation,
                        onRetry: (attempt, error, delayMs) => {
                              logger.warn({
                                    level: 'warn',
                                    message: `Retrying request (attempt ${attempt})`,
                                    timestamp: new Date().toISOString(),
                                    requestId: correlationId,
                                    correlationId,
                                    method: requestConfig.method,
                                    url: requestConfig.path,
                                    error:
                                          error instanceof Error
                                                ? error.message
                                                : 'Unknown',
                                    retryCount: attempt,
                                    durationMs: delayMs,
                              })
                        },
                  },
            )
      }

      // -------------------------------------------------------------------------
      // Public API
      // -------------------------------------------------------------------------

      return {
            get<TData>(
                  path: string,
                  requestConfig?: Omit<
                        ApiRequestConfig,
                        'method' | 'path' | 'body'
                  >,
            ): Promise<ApiResponse<TData>> {
                  return executeRequest<TData>({
                        ...requestConfig,
                        method: 'GET',
                        path,
                  })
            },

            post<TData, TBody = unknown>(
                  path: string,
                  requestConfig?: Omit<
                        ApiRequestConfig<TBody>,
                        'method' | 'path'
                  >,
            ): Promise<ApiResponse<TData>> {
                  return executeRequest<TData>({
                        ...requestConfig,
                        method: 'POST',
                        path,
                  })
            },

            put<TData, TBody = unknown>(
                  path: string,
                  requestConfig?: Omit<
                        ApiRequestConfig<TBody>,
                        'method' | 'path'
                  >,
            ): Promise<ApiResponse<TData>> {
                  return executeRequest<TData>({
                        ...requestConfig,
                        method: 'PUT',
                        path,
                  })
            },

            patch<TData, TBody = unknown>(
                  path: string,
                  requestConfig?: Omit<
                        ApiRequestConfig<TBody>,
                        'method' | 'path'
                  >,
            ): Promise<ApiResponse<TData>> {
                  return executeRequest<TData>({
                        ...requestConfig,
                        method: 'PATCH',
                        path,
                  })
            },

            del<TData>(
                  path: string,
                  requestConfig?: Omit<
                        ApiRequestConfig,
                        'method' | 'path' | 'body'
                  >,
            ): Promise<ApiResponse<TData>> {
                  return executeRequest<TData>({
                        ...requestConfig,
                        method: 'DELETE',
                        path,
                  })
            },

            upload<TData>(
                  path: string,
                  formData: FormData,
                  requestConfig?: Omit<
                        ApiRequestConfig,
                        'method' | 'path' | 'body'
                  >,
            ): Promise<ApiResponse<TData>> {
                  return executeRequest<TData>({
                        ...requestConfig,
                        method: 'POST',
                        path,
                        body: formData,
                  })
            },

            download(
                  path: string,
                  requestConfig?: Omit<
                        ApiRequestConfig,
                        'method' | 'path' | 'body' | 'responseType'
                  >,
            ): Promise<ApiResponse<Blob>> {
                  return executeRequest<Blob>({
                        ...requestConfig,
                        method: 'GET',
                        path,
                        responseType: 'blob',
                  })
            },

            stream(
                  path: string,
                  requestConfig?: Omit<
                        ApiRequestConfig,
                        'method' | 'path' | 'body' | 'responseType'
                  >,
            ): Promise<ApiResponse<ReadableStream<Uint8Array>>> {
                  return executeRequest<ReadableStream<Uint8Array>>({
                        ...requestConfig,
                        method: 'GET',
                        path,
                        responseType: 'stream',
                  })
            },
      }
}
