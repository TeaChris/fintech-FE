/**
 * Request/correlation ID generation and distributed tracing support.
 *
 * Design decisions:
 * - Uses `crypto.randomUUID()` — available in all modern runtimes
 *   including Edge (no `uuid` package needed)
 * - Correlation IDs propagate across the request lifecycle
 * - Request IDs are unique per-request (even on retries)
 * - Duration tracking uses `performance.now()` where available,
 *   with `Date.now()` fallback for Edge
 * - OTel integration is optional and non-intrusive
 */

// ---------------------------------------------------------------------------
// ID Generation
// ---------------------------------------------------------------------------

/**
 * Generate a unique request ID.
 * Each individual HTTP request (including retries) gets a unique ID.
 *
 * Uses crypto.randomUUID() which is available in:
 * - All modern browsers
 * - Node.js 19+
 * - Edge runtimes (Vercel, Cloudflare Workers)
 */
export function generateRequestId(): string {
      // crypto.randomUUID is universally available in the target runtimes
      if (
            typeof crypto !== 'undefined' &&
            typeof crypto.randomUUID === 'function'
      ) {
            return crypto.randomUUID()
      }

      // Fallback for extremely old environments (should never hit this)
      return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`
}

/**
 * Generate a correlation ID.
 * This ID stays the same across retries and related requests
 * (e.g. auth refresh + original request retry).
 *
 * Prefixed with 'cor-' for easy identification in logs.
 */
export function generateCorrelationId(): string {
      return `cor-${generateRequestId()}`
}

// ---------------------------------------------------------------------------
// Tracing Headers
// ---------------------------------------------------------------------------

/** Standard header names for distributed tracing */
export const TRACING_HEADERS = {
      REQUEST_ID: 'X-Request-ID',
      CORRELATION_ID: 'X-Correlation-ID',
      CLIENT_TIMESTAMP: 'X-Client-Timestamp',
      CLIENT_VERSION: 'X-Client-Version',
} as const

/**
 * Build tracing headers for a request.
 * These are injected by the tracing middleware.
 */
export function buildTracingHeaders(options: {
      requestId: string
      correlationId: string
      clientVersion?: string
}): Record<string, string> {
      const headers: Record<string, string> = {
            [TRACING_HEADERS.REQUEST_ID]: options.requestId,
            [TRACING_HEADERS.CORRELATION_ID]: options.correlationId,
            [TRACING_HEADERS.CLIENT_TIMESTAMP]: new Date().toISOString(),
      }

      if (options.clientVersion) {
            headers[TRACING_HEADERS.CLIENT_VERSION] = options.clientVersion
      }

      return headers
}

// ---------------------------------------------------------------------------
// Duration Tracking
// ---------------------------------------------------------------------------

/**
 * Get a high-resolution timestamp for duration measurement.
 *
 * Uses `performance.now()` in browser and Node.js (microsecond precision).
 * Falls back to `Date.now()` in Edge runtime if `performance` is unavailable.
 */
export function getTimestamp(): number {
      if (
            typeof performance !== 'undefined' &&
            typeof performance.now === 'function'
      ) {
            return performance.now()
      }
      return Date.now()
}

/**
 * Calculate elapsed duration in milliseconds.
 * Rounds to 2 decimal places for readability.
 */
export function calculateDuration(startTime: number): number {
      const elapsed = getTimestamp() - startTime
      return Math.round(elapsed * 100) / 100
}

// ---------------------------------------------------------------------------
// OpenTelemetry Integration Hooks
// ---------------------------------------------------------------------------

/**
 * OTel span attributes for API requests.
 * These map to OpenTelemetry semantic conventions for HTTP.
 */
export interface OTelSpanAttributes {
      'http.method': string
      'http.url': string
      'http.status_code'?: number
      'http.request_id': string
      'http.correlation_id': string
      'http.duration_ms'?: number
      'http.retry_count'?: number
      'error.type'?: string
      'error.message'?: string
}

/**
 * Hook interface for OpenTelemetry integration.
 *
 * Implement this interface to instrument API requests with OTel spans.
 * The hook is called at the start and end of each request.
 */
export interface TracingHook {
      /** Called when a request starts */
      onRequestStart(attributes: OTelSpanAttributes): void

      /** Called when a request completes (success or failure) */
      onRequestEnd(attributes: OTelSpanAttributes): void

      /** Called when an error occurs */
      onRequestError(attributes: OTelSpanAttributes, error: Error): void
}

/**
 * Default noop tracing hook.
 * Used when no OTel integration is configured.
 */
export const noopTracingHook: TracingHook = {
      onRequestStart: () => undefined,
      onRequestEnd: () => undefined,
      onRequestError: () => undefined,
}

/**
 * Extract the server-provided request ID from response headers.
 * Falls back to the client-generated ID if the server doesn't echo it.
 */
export function extractServerRequestId(
      responseHeaders: Headers,
      clientRequestId: string,
): string {
      return (
            responseHeaders.get(TRACING_HEADERS.REQUEST_ID) ??
            responseHeaders.get('x-request-id') ??
            clientRequestId
      )
}
