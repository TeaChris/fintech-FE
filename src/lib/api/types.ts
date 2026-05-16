// ─────────────────────────────────────────────────────────────────────────────
// types.ts — Strict TypeScript interfaces and unified Error class
// Zero-dependency API client built on native `fetch`
// ─────────────────────────────────────────────────────────────────────────────

// ─── Requirement 1: Core Architecture & Types ────────────────────────────────

/** Supported HTTP verbs */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/** Runtime environment for config resolution */
export type Environment = 'development' | 'staging' | 'production'

/** Log verbosity levels (Requirement 15: Logging) */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'

/** Serialisation style for query parameters */
export type QueryParamStyle = 'flat' | 'bracket' | 'comma' | 'repeat'

/** Body encoding hint — drives Content-Type and serialisation strategy */
export type BodyType = 'json' | 'form-data' | 'blob' | 'text' | 'url-encoded' | 'array-buffer'

/** Hint for how the response body should be parsed (Requirement 12: Response Parsing) */
export type ResponseType = 'json' | 'text' | 'blob' | 'arrayBuffer' | 'stream'

// ─── Requirement 1: Config & Defaults ────────────────────────────────────────

/** Per-request configuration that can override defaults */
export interface RequestConfig {
  /** Override the base URL for this request only */
  baseURL?: string
  /** Request timeout in milliseconds */
  timeout?: number
  /** Additional request headers (merged with defaults) */
  headers?: Record<string, string>
  /** Query parameters — serialised automatically (Requirement 1: query param object serialisation) */
  params?: Record<string, unknown>
  /** Whether to include credentials (cookies) */
  withCredentials?: boolean
  /** AbortSignal for cancellation (Requirement 9: Cancellation) */
  signal?: AbortSignal
  /** Skip automatic auth-header attachment (Requirement 5: Auth) */
  skipAuth?: boolean
  /** Disable retry for this request (Requirement 8: Retry) */
  skipRetry?: boolean
  /** Serialisation style for query params */
  queryStyle?: QueryParamStyle
  /** Body encoding strategy (Requirement 1: varied body support — JSON, FormData, Blob) */
  bodyType?: BodyType
  /** How to parse the response body (Requirement 12: Response Parsing) */
  responseType?: ResponseType
  /** CSRF token to attach (Requirement 16: Security — CSRF header) */
  csrfToken?: string
  /** CSRF header name (defaults to 'X-CSRF-Token') */
  csrfHeaderName?: string
  /** @internal — current retry attempt counter */
  _retryCount?: number
  /** @internal — marks a request as the refresh call itself to prevent loops */
  _isRefreshRequest?: boolean
}

// ─── Requirement 12: Normalised Response ─────────────────────────────────────

/** Every successful response is normalised to this shape */
export interface ApiResponse<T = unknown> {
  /** The parsed response body */
  data: T
  /** HTTP status code */
  status: number
  /** Response headers as a flat string map */
  headers: Record<string, string>
  /** The raw `Response` object from `fetch` */
  originalResponse: Response
}

// ─── Requirement 7: Robust Errors — ApiError class ───────────────────────────

/**
 * Error classification codes — distinguishes between network failures,
 * HTTP errors, timeouts, cancellations, and business-logic errors.
 */
export type ApiErrorCode =
  | 'NETWORK_ERROR'
  | 'HTTP_ERROR'
  | 'TIMEOUT_ERROR'
  | 'CANCELLED'
  | 'BUSINESS_ERROR'
  | 'UNKNOWN'

/** Shape implemented by every ApiError instance */
export interface ApiErrorShape {
  message: string
  status: number | null
  data: unknown
  headers: Record<string, string>
  code: ApiErrorCode
  isNetworkError: boolean
  isHttpError: boolean
  isTimeoutError: boolean
  isCancelled: boolean
  isBusinessError: boolean
}

/**
 * Unified error class for all API failures.
 * Requirement 7: Differentiate Network, HTTP (4xx/5xx), Timeout/Cancel,
 * and Business-logic errors using a single class.
 */
export class ApiError extends Error implements ApiErrorShape {
  readonly status: number | null
  readonly data: unknown
  readonly headers: Record<string, string>
  readonly code: ApiErrorCode
  readonly isNetworkError: boolean
  readonly isHttpError: boolean
  readonly isTimeoutError: boolean
  readonly isCancelled: boolean
  readonly isBusinessError: boolean

  constructor(shape: Partial<ApiErrorShape> & { message: string }) {
    super(shape.message)
    this.name = 'ApiError'
    this.status = shape.status ?? null
    this.data = shape.data ?? null
    this.headers = shape.headers ?? {}
    this.code = shape.code ?? 'UNKNOWN'
    this.isNetworkError = shape.isNetworkError ?? false
    this.isHttpError = shape.isHttpError ?? false
    this.isTimeoutError = shape.isTimeoutError ?? false
    this.isCancelled = shape.isCancelled ?? false
    this.isBusinessError = shape.isBusinessError ?? false

    // Preserve prototype chain for instanceof checks
    Object.setPrototypeOf(this, ApiError.prototype)
  }

  // ── Factory methods ──────────────────────────────────────────────────────

  /** Create from a failed HTTP response (4xx / 5xx) */
  static fromResponse(response: Response, body: unknown): ApiError {
    const headers = flattenHeaders(response.headers)
    const is4xx = response.status >= 400 && response.status < 500
    const is5xx = response.status >= 500

    return new ApiError({
      message: `HTTP ${response.status}: ${response.statusText || 'Request failed'}`,
      status: response.status,
      data: body,
      headers,
      code: 'HTTP_ERROR',
      isHttpError: true,
      // Treat 422 with structured body as a business error
      isBusinessError: is4xx && response.status === 422,
      isNetworkError: false,
      isTimeoutError: false,
      isCancelled: false,
    })
  }

  /** Create from a network-level failure (DNS, connection refused, etc.) */
  static networkError(error: Error): ApiError {
    return new ApiError({
      message: error.message || 'Network error',
      code: 'NETWORK_ERROR',
      isNetworkError: true,
    })
  }

  /** Create from an AbortController timeout */
  static timeoutError(timeoutMs: number): ApiError {
    return new ApiError({
      message: `Request timed out after ${timeoutMs}ms`,
      code: 'TIMEOUT_ERROR',
      isTimeoutError: true,
    })
  }

  /** Create from a user- or code-initiated abort */
  static cancelledError(reason?: string): ApiError {
    return new ApiError({
      message: reason ?? 'Request was cancelled',
      code: 'CANCELLED',
      isCancelled: true,
    })
  }

  /** Create a business-logic error from a response payload */
  static businessError(message: string, data: unknown): ApiError {
    return new ApiError({
      message,
      code: 'BUSINESS_ERROR',
      data,
      isBusinessError: true,
    })
  }

  /** Type guard — works across iframes and module boundaries */
  static isApiError(value: unknown): value is ApiError {
    return value instanceof ApiError || (value as ApiError)?.name === 'ApiError'
  }
}

// ─── Requirement 4: Interceptors ─────────────────────────────────────────────

/**
 * Request interceptor — receives a mutable config copy and must return it
 * (or a modified version). Runs in LIFO order (last-added runs first).
 */
export interface RequestInterceptor {
  onFulfilled: (config: InterceptorRequestConfig) => InterceptorRequestConfig | Promise<InterceptorRequestConfig>
  onRejected?: (error: unknown) => unknown
}

/**
 * Response interceptor — receives a normalised ApiResponse and may transform it.
 * Runs in FIFO order (first-added runs first).
 */
export interface ResponseInterceptor {
  onFulfilled: (response: ApiResponse<unknown>) => ApiResponse<unknown> | Promise<ApiResponse<unknown>>
  onRejected?: (error: unknown) => unknown
}

/** The config shape that interceptors receive (enriched with internal fields) */
export interface InterceptorRequestConfig extends RequestConfig {
  /** The fully resolved URL (base + path + query) */
  url: string
  /** HTTP method */
  method: HttpMethod
  /** Request body (pre-serialisation) */
  body?: unknown
  /** Timestamp when the request pipeline started */
  _startTime?: number
}

// ─── Requirement 8: Retry & Backoff ──────────────────────────────────────────

/** Strategy for delay calculation between retries */
export type BackoffStrategy = 'exponential' | 'linear' | 'fixed'

/** Full retry configuration */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  count: number
  /** Base delay in milliseconds */
  delay: number
  /** Delay growth strategy */
  backoff: BackoffStrategy
  /** Whether to add random jitter to avoid thundering herd */
  jitter: boolean
  /** HTTP status codes that should trigger a retry */
  retryOn: number[]
  /** If true, only retry idempotent methods (GET, PUT, DELETE, HEAD, OPTIONS) */
  idempotentOnly: boolean
  /** If true, honour the `Retry-After` header when present */
  respectRetryAfter: boolean
}

// ─── Requirement 5: Auth & Session ───────────────────────────────────────────

/** Authentication configuration */
export interface AuthConfig {
  /** sessionStorage key for the access token */
  tokenKey: string
  /** sessionStorage key for the refresh token */
  refreshTokenKey: string
  /** Endpoint to POST refresh requests to */
  refreshEndpoint: string
  /** Header name for the auth token (e.g. 'Authorization') */
  headerName: string
  /** Auth scheme prefix (e.g. 'Bearer') */
  scheme: string
  /** Custom function to extract the new access token from the refresh response */
  extractToken?: (responseData: unknown) => string
}

// ─── Requirement 11: File Uploads with Progress ──────────────────────────────

/** Upload-specific config — extends RequestConfig with progress callback */
export interface UploadConfig extends RequestConfig {
  /** Called periodically with upload progress */
  onProgress?: (percent: number, loaded: number, total: number) => void
}

/** Download-specific config — extends RequestConfig with progress and filename */
export interface DownloadConfig extends RequestConfig {
  /** If provided, triggers a browser download with this filename */
  filename?: string
  /** Called periodically with download progress */
  onProgress?: (loaded: number, total: number | null) => void
  /** Override MIME type for the downloaded blob */
  mimeType?: string
}

// ─── Requirement 10: Rate Limiting & Queueing ────────────────────────────────

/** Offline-queue / rate-limit configuration */
export interface QueueConfig {
  /** Enable offline request queueing */
  enableOfflineQueue: boolean
}

// ─── Top-level client config ─────────────────────────────────────────────────

/** Constructor config for the ApiClient class */
export interface ApiClientConfig {
  /** Base URL for all requests (Requirement 14: Environment/Config) */
  baseURL?: string
  /** Default timeout in milliseconds */
  timeout?: number
  /** Default headers merged into every request */
  defaultHeaders?: Record<string, string>
  /** Send credentials (cookies) with requests */
  withCredentials?: boolean
  /** Runtime environment — drives baseURL/timeout resolution (Requirement 14) */
  environment?: Environment
  /** Log verbosity (Requirement 15: Logging) */
  logLevel?: LogLevel
  /** Default query-param serialisation style */
  queryStyle?: QueryParamStyle
  /** Retry configuration (Requirement 8) */
  retry?: Partial<RetryConfig>
  /** Authentication configuration (Requirement 5) */
  auth?: Partial<AuthConfig>
  /** Offline queue configuration (Requirement 10) */
  queue?: Partial<QueueConfig>
  /** Global CSRF token (Requirement 16: Security) */
  csrfToken?: string
  /** CSRF header name — defaults to 'X-CSRF-Token' (Requirement 16) */
  csrfHeaderName?: string
}

// ─── Helper ──────────────────────────────────────────────────────────────────

/** Flatten a `Headers` object into a plain `Record<string, string>` */
export function flattenHeaders(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {}
  headers.forEach((value, key) => {
    out[key] = value
  })
  return out
}
