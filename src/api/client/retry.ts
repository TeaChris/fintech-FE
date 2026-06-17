/**
 * Retry engine with exponential backoff, jitter, and safety rules.
 *
 * Design decisions:
 * - Exponential backoff: delay = baseDelay * 2^attempt
 * - Jitter: ±jitterFactor random noise to prevent thundering herd
 * - Retry budgets: max N retries per request
 * - NEVER auto-retry financial POST mutations (safety critical)
 * - Honors Retry-After header for 429 responses
 * - Respects AbortSignal for cancellation during wait
 * - Configurable per-request via ApiRequestConfig.retry
 * - Edge-compatible (no Node.js timers)
 */

import type { HttpMethod, RetryConfig } from '@/api/types'
import { DEFAULT_RETRY_CONFIG } from './config'
import {
      isApiError,
      type ApiError,
      isNetworkError,
      isTimeoutError,
      isRateLimitError,
} from './errors'

// ---------------------------------------------------------------------------
// Retry Decision
// ---------------------------------------------------------------------------

/**
 * Determine whether a failed request should be retried.
 *
 * @param error - The error that occurred
 * @param attempt - Current attempt number (0-indexed)
 * @param config - Retry configuration
 * @param method - HTTP method of the request
 * @param isFinancialMutation - Whether this is a financial mutation
 * @returns Whether the request should be retried
 */
export function shouldRetry(
      error: unknown,
      attempt: number,
      config: RetryConfig,
      method: HttpMethod,
      isFinancialMutation: boolean = false,
): boolean {
      // Never exceed max retries
      if (attempt >= config.maxRetries) {
            return false
      }

      // CRITICAL: Never auto-retry financial mutations (any method)
      // This prevents duplicate charges, transfers, etc.
      if (isFinancialMutation) {
            return false
      }

      // Network errors (offline, DNS, connection refused)
      if (isNetworkError(error)) {
            return config.retryOnNetworkError
      }

      // Timeout errors
      if (isTimeoutError(error)) {
            return true
      }

      // API errors with known status codes
      if (isApiError(error)) {
            const apiError = error as ApiError

            // Rate limit errors — always retryable
            if (isRateLimitError(error)) {
                  return true
            }

            // Check if the status code is in the retryable list
            return config.retryableStatuses.includes(apiError.status)
      }

      // Unknown errors — don't retry to be safe
      return false
}

// ---------------------------------------------------------------------------
// Backoff Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate the delay before the next retry attempt.
 *
 * Uses exponential backoff with jitter:
 * - Base delay doubles with each attempt
 * - Random jitter prevents synchronized retries (thundering herd)
 * - Capped at maxDelay to prevent absurd wait times
 * - Honors Retry-After header for 429 responses
 *
 * @param attempt - Current attempt number (0-indexed)
 * @param config - Retry configuration
 * @param error - The error that triggered the retry
 * @returns Delay in milliseconds
 */
export function calculateBackoff(
      attempt: number,
      config: RetryConfig,
      error?: unknown,
): number {
      // If we have a Retry-After value from the server, honor it
      if (isRateLimitError(error)) {
            const retryAfterMs = error.retryAfterSeconds * 1000
            // Guard against NaN propagation from malformed Retry-After headers
            if (isNaN(retryAfterMs) || retryAfterMs <= 0) {
                  return config.maxDelay
            }
            // Add a small jitter to avoid all clients retrying at the same instant
            const jitter = retryAfterMs * config.jitterFactor * Math.random()
            return retryAfterMs + jitter
      }

      // Exponential backoff: baseDelay * 2^attempt
      const exponentialDelay = config.baseDelay * Math.pow(2, attempt)

      // Cap at maxDelay
      const cappedDelay = Math.min(exponentialDelay, config.maxDelay)

      // Apply jitter: ±jitterFactor
      const jitterRange = cappedDelay * config.jitterFactor
      const jitter = jitterRange * (2 * Math.random() - 1) // Random between -range and +range

      // Ensure delay is never negative
      return Math.max(0, Math.round(cappedDelay + jitter))
}

// ---------------------------------------------------------------------------
// Delay with Abort Support
// ---------------------------------------------------------------------------

/**
 * Wait for the specified delay, but abort early if the signal fires.
 *
 * Returns `true` if the delay completed normally.
 * Returns `false` if the delay was aborted.
 */
export function waitWithAbort(
      delayMs: number,
      signal?: AbortSignal,
): Promise<boolean> {
      return new Promise((resolve) => {
            if (signal?.aborted) {
                  resolve(false)
                  return
            }

            const timer = setTimeout(() => {
                  cleanup()
                  resolve(true)
            }, delayMs)

            function cleanup(): void {
                  if (signal) {
                        signal.removeEventListener('abort', onAbort)
                  }
            }

            function onAbort(): void {
                  clearTimeout(timer)
                  cleanup()
                  resolve(false)
            }

            if (signal) {
                  signal.addEventListener('abort', onAbort, { once: true })
            }
      })
}

// ---------------------------------------------------------------------------
// Retry Executor
// ---------------------------------------------------------------------------

/**
 * Execute a function with retry logic.
 *
 * This is the main retry orchestrator. It wraps any async function
 * and retries it according to the configuration.
 *
 * @param fn - The async function to execute
 * @param config - Retry configuration (merged with defaults)
 * @param options - Additional options (method, signal, financial flag)
 * @returns The result of the function
 * @throws The last error if all retries are exhausted
 */
export async function executeWithRetry<T>(
      fn: (attempt: number) => Promise<T>,
      config: Partial<RetryConfig> = {},
      options: {
            method?: HttpMethod
            signal?: AbortSignal
            isFinancialMutation?: boolean
            onRetry?: (attempt: number, error: unknown, delayMs: number) => void
      } = {},
): Promise<T> {
      const mergedConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
      const {
            method = 'GET',
            signal,
            isFinancialMutation = false,
            onRetry,
      } = options

      let lastError: unknown

      for (let attempt = 0; attempt <= mergedConfig.maxRetries; attempt++) {
            try {
                  // Check if already aborted
                  if (signal?.aborted) {
                        throw new DOMException('Request aborted', 'AbortError')
                  }

                  return await fn(attempt)
            } catch (error) {
                  lastError = error

                  // Don't retry if aborted
                  if (signal?.aborted) {
                        throw error
                  }

                  // Check if we should retry
                  if (
                        !shouldRetry(
                              error,
                              attempt,
                              mergedConfig,
                              method,
                              isFinancialMutation,
                        )
                  ) {
                        throw error
                  }

                  // Calculate backoff delay
                  const delayMs = calculateBackoff(attempt, mergedConfig, error)

                  // Notify retry callback
                  onRetry?.(attempt + 1, error, delayMs)

                  // Wait with abort support
                  const waited = await waitWithAbort(delayMs, signal)

                  if (!waited) {
                        // Aborted during wait
                        throw error
                  }
            }
      }

      // Should never reach here, but TypeScript needs it
      throw lastError
}
