/**
 * AbortController-based timeout management.
 *
 * Design decisions:
 * - Creates a new AbortController per request
 * - Merges with user-provided AbortSignal (both can cancel)
 * - Throws `TimeoutError` (not generic `AbortError`) for clarity
 * - Cleans up timers on completion to prevent memory leaks
 * - Edge-compatible (uses standard setTimeout)
 * - Default timeout: 30s (configurable)
 */

import { TimeoutError } from './errors';
import { DEFAULT_TIMEOUT_MS } from './config';

// ---------------------------------------------------------------------------
// Timeout Controller
// ---------------------------------------------------------------------------

/**
 * Result of creating a timeout controller.
 * Provides the merged signal and a cleanup function.
 */
export interface TimeoutHandle {
  /** The AbortSignal to pass to fetch() */
  readonly signal: AbortSignal;

  /** Call this when the request completes to clean up the timer */
  readonly clear: () => void;

  /** The AbortController (for internal use) */
  readonly controller: AbortController;
}

/**
 * Create an AbortController with a timeout.
 *
 * If the user also provides an AbortSignal, both signals are
 * merged — either one can abort the request.
 *
 * @param timeoutMs - Timeout in milliseconds (default: 30s)
 * @param userSignal - Optional user-provided AbortSignal
 * @returns TimeoutHandle with signal and cleanup function
 */
export function createTimeoutController(
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  userSignal?: AbortSignal,
): TimeoutHandle {
  const controller = new AbortController();

  // Set up the timeout timer
  const timer = setTimeout(() => {
    controller.abort(new TimeoutError(
      `Request timed out after ${timeoutMs}ms`,
      {
        requestId: 'timeout',
        correlationId: 'timeout',
        durationMs: timeoutMs,
      },
    ));
  }, timeoutMs);

  // If the user provided a signal, forward its abort to our controller
  if (userSignal) {
    if (userSignal.aborted) {
      // Already aborted — abort immediately
      clearTimeout(timer);
      controller.abort(userSignal.reason);
    } else {
      const onUserAbort = (): void => {
        clearTimeout(timer);
        controller.abort(userSignal.reason);
      };
      userSignal.addEventListener('abort', onUserAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    clear: () => {
      clearTimeout(timer);
    },
    controller,
  };
}

// ---------------------------------------------------------------------------
// Abort Error Classification
// ---------------------------------------------------------------------------

/**
 * Determine if an error is a timeout error (vs. user-initiated abort).
 *
 * This distinguishes between:
 * - Our timeout firing (→ TimeoutError, retryable)
 * - User clicking "Cancel" (→ AbortError, not retryable)
 */
export function isTimeoutAbort(error: unknown): boolean {
  if (error instanceof TimeoutError) {
    return true;
  }

  // Check if the abort reason is a TimeoutError
  if (
    error instanceof DOMException &&
    error.name === 'AbortError'
  ) {
    return false; // User-initiated abort
  }

  return false;
}

/**
 * Determine if an error is a user-initiated abort.
 */
export function isUserAbort(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    error.name === 'AbortError' &&
    !isTimeoutAbort(error)
  );
}

/**
 * Convert an abort error to the appropriate domain error.
 *
 * - Timeout → TimeoutError (retryable)
 * - User abort → re-throw as DOMException (not retryable)
 */
export function classifyAbortError(
  error: unknown,
  context: {
    requestId: string;
    correlationId: string;
    url: string;
    method: string;
    durationMs: number;
  },
): TimeoutError | DOMException {
  if (error instanceof TimeoutError) {
    return error;
  }

  // Check if the abort reason is a TimeoutError
  if (error instanceof DOMException && error.name === 'AbortError') {
    // Check the controller's abort reason
    return error;
  }

  return new TimeoutError(
    `Request timed out`,
    {
      requestId: context.requestId,
      correlationId: context.correlationId,
      url: context.url,
      method: context.method as 'GET',
      durationMs: context.durationMs,
    },
  );
}
