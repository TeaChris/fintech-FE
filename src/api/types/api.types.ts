/**
 * Core API type definitions for the fintech API client SDK.
 *
 * Design principles:
 * - No `any` types — strict TypeScript throughout
 * - Money is ALWAYS represented as string (never number/float)
 * - Generic response typing for full inference
 * - Runtime-safe parsing via Zod integration
 * - SSR, CSR, and Edge runtime compatibility
 */

import type { ZodType } from 'zod';

// ---------------------------------------------------------------------------
// HTTP Primitives
// ---------------------------------------------------------------------------

/** Supported HTTP methods */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Headers that can be passed as a plain object or native Headers */
export type HeadersInit = Record<string, string> | Headers;

// ---------------------------------------------------------------------------
// Money Safety
// ---------------------------------------------------------------------------

/**
 * Money value representation.
 * NEVER use `number` for monetary amounts — IEEE 754 floating point
 * is unsuitable for financial calculations.
 *
 * The `amount` field is a decimal string (e.g. "1234.56").
 * The `currency` field is an ISO 4217 code (e.g. "NGN", "USD").
 */
export interface MoneyValue {
  readonly amount: string;
  readonly currency: string;
}

// ---------------------------------------------------------------------------
// Request Configuration
// ---------------------------------------------------------------------------

/** Path parameters for URL interpolation (e.g. `/accounts/{id}`) */
export type PathParams = Record<string, string | number>;

/** Query parameters for URL search strings */
export type QueryParams = Record<
  string,
  string | number | boolean | string[] | number[] | undefined
>;

/**
 * Per-request configuration passed to the fetcher.
 * Generic over the request body type `TBody`.
 */
export interface ApiRequestConfig<TBody = unknown> {
  /** HTTP method */
  readonly method: HttpMethod;

  /** URL path (relative to base URL, e.g. '/accounts/{id}') */
  readonly path: string;

  /** Path parameters for URL interpolation */
  readonly params?: PathParams;

  /** Query/search parameters */
  readonly query?: QueryParams;

  /** Request body (JSON-serializable, FormData, Blob, or ReadableStream) */
  readonly body?: TBody;

  /** Additional headers for this request */
  readonly headers?: HeadersInit;

  /** Zod schema for response validation */
  readonly schema?: ZodType;

  /** Override default timeout (ms) */
  readonly timeout?: number;

  /** Override default retry configuration */
  readonly retry?: Partial<RetryConfig>;

  /** External AbortSignal for cancellation */
  readonly signal?: AbortSignal;

  /** Idempotency key for mutation safety */
  readonly idempotencyKey?: string;

  /** Expected response type */
  readonly responseType?: ResponseType;

  /** Tags for cache invalidation (TanStack Query) */
  readonly tags?: readonly string[];

  /**
   * Whether this request is a financial mutation that must NOT
   * be auto-retried. Defaults to false.
   */
  readonly isFinancialMutation?: boolean;

  /**
   * Whether to skip auth header injection.
   * Useful for public endpoints (e.g. login).
   */
  readonly skipAuth?: boolean;

  /**
   * Whether to skip CSRF token injection.
   * Useful for GET requests (auto-detected).
   */
  readonly skipCsrf?: boolean;
}

/** Expected response content type */
export type ResponseType = 'json' | 'blob' | 'text' | 'stream' | 'empty';

// ---------------------------------------------------------------------------
// Response Types
// ---------------------------------------------------------------------------

/**
 * Normalized API response wrapper.
 * Every successful API call returns this shape.
 */
export interface ApiResponse<TData> {
  /** Parsed and validated response data */
  readonly data: TData;

  /** HTTP status code */
  readonly status: number;

  /** Response headers (read-only) */
  readonly headers: Headers;

  /** Request metadata for observability */
  readonly meta: ResponseMeta;
}

/** Metadata attached to every response for observability */
export interface ResponseMeta {
  /** Unique request ID (X-Request-ID) */
  readonly requestId: string;

  /** Correlation ID for distributed tracing */
  readonly correlationId: string;

  /** Request duration in milliseconds */
  readonly durationMs: number;

  /** Number of retry attempts made */
  readonly retryCount: number;

  /** Timestamp of when the request was initiated */
  readonly timestamp: string;

  /** The final URL that was requested */
  readonly url: string;

  /** HTTP method used */
  readonly method: HttpMethod;
}

/**
 * Error response shape returned by the API backend.
 * Used to parse error bodies before mapping to domain errors.
 */
export interface ApiErrorResponse {
  readonly error?: string;
  readonly message?: string;
  readonly code?: string;
  readonly details?: Record<string, unknown>;
  readonly requestId?: string;
  readonly retryAfter?: number;
  readonly fields?: Record<string, string[]>;
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

/** Cursor-based paginated response */
export interface CursorPaginatedResponse<TItem> {
  readonly data: readonly TItem[];
  readonly cursor: string | null;
  readonly hasMore: boolean;
  readonly total?: number;
}

/** Offset-based paginated response */
export interface OffsetPaginatedResponse<TItem> {
  readonly data: readonly TItem[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
  readonly totalItems: number;
}

/** Union of pagination response types */
export type PaginatedResponse<TItem> =
  | CursorPaginatedResponse<TItem>
  | OffsetPaginatedResponse<TItem>;

// ---------------------------------------------------------------------------
// Retry Configuration
// ---------------------------------------------------------------------------

export interface RetryConfig {
  /** Maximum number of retry attempts. Default: 3 */
  readonly maxRetries: number;

  /** Base delay in ms for exponential backoff. Default: 1000 */
  readonly baseDelay: number;

  /** Maximum delay in ms. Default: 30000 */
  readonly maxDelay: number;

  /** Jitter factor (0–1). Default: 0.3 */
  readonly jitterFactor: number;

  /**
   * HTTP status codes that are retryable.
   * Default: [408, 429, 500, 502, 503, 504]
   */
  readonly retryableStatuses: readonly number[];

  /**
   * Whether to retry on network errors (offline, DNS failure).
   * Default: true
   */
  readonly retryOnNetworkError: boolean;
}

// ---------------------------------------------------------------------------
// Auth Configuration
// ---------------------------------------------------------------------------

export interface AuthConfig {
  /** Endpoint for token refresh. Default: '/auth/refresh' */
  readonly refreshEndpoint: string;

  /** HTTP method for refresh. Default: 'POST' */
  readonly refreshMethod: HttpMethod;

  /** Name of the CSRF cookie. Default: 'XSRF-TOKEN' */
  readonly csrfCookieName: string;

  /** Name of the CSRF header. Default: 'X-XSRF-TOKEN' */
  readonly csrfHeaderName: string;

  /** Paths that do NOT require auth headers */
  readonly publicPaths: readonly string[];

  /** Callback invoked when refresh fails (e.g. redirect to login) */
  readonly onAuthFailure?: () => void;
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

/** Log severity levels */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Structured log entry */
export interface LogEntry {
  readonly level: LogLevel;
  readonly message: string;
  readonly timestamp: string;
  readonly requestId?: string;
  readonly correlationId?: string;
  readonly method?: HttpMethod;
  readonly url?: string;
  readonly status?: number;
  readonly durationMs?: number;
  readonly retryCount?: number;
  readonly error?: string;
  readonly [key: string]: unknown;
}

/** Logger interface — injectable for DI */
export interface Logger {
  debug(entry: LogEntry): void;
  info(entry: LogEntry): void;
  warn(entry: LogEntry): void;
  error(entry: LogEntry): void;
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

/**
 * Request context passed through the middleware pipeline.
 * Mutable — middleware can enrich it.
 */
export interface RequestContext {
  /** Unique request ID */
  requestId: string;

  /** Correlation ID for distributed tracing */
  correlationId: string;

  /** Request start time (performance.now or Date.now) */
  startTime: number;

  /** Current retry attempt (0-indexed) */
  attempt: number;

  /** The request config being processed */
  config: ApiRequestConfig;

  /** Computed headers (accumulated by middleware) */
  headers: Record<string, string>;

  /** Metadata bag for middleware to attach custom data */
  metadata: Record<string, unknown>;
}

/**
 * Middleware function signature.
 * Each middleware receives the context and a `next` function
 * to call the next middleware in the chain.
 */
export type Middleware = (
  context: RequestContext,
  next: () => Promise<Response>,
) => Promise<Response>;

// ---------------------------------------------------------------------------
// Client Configuration
// ---------------------------------------------------------------------------

/** Top-level API client configuration */
export interface ApiClientConfig {
  /** Base URL for all API requests */
  readonly baseUrl: string;

  /** Default timeout in ms. Default: 30000 */
  readonly timeout: number;

  /** Default retry configuration */
  readonly retry: RetryConfig;

  /** Auth configuration */
  readonly auth: AuthConfig;

  /** Custom middleware to add to the pipeline */
  readonly middleware?: readonly Middleware[];

  /** Logger implementation. Default: noop logger */
  readonly logger?: Logger;

  /** Default headers applied to all requests */
  readonly defaultHeaders?: Record<string, string>;

  /**
   * Runtime environment hint.
   * Auto-detected if not provided.
   */
  readonly runtime?: 'browser' | 'server' | 'edge';
}

// ---------------------------------------------------------------------------
// API Client Interface
// ---------------------------------------------------------------------------

/** The public interface of the API client */
export interface ApiClient {
  get<TData>(
    path: string,
    config?: Omit<ApiRequestConfig, 'method' | 'path' | 'body'>,
  ): Promise<ApiResponse<TData>>;

  post<TData, TBody = unknown>(
    path: string,
    config?: Omit<ApiRequestConfig<TBody>, 'method' | 'path'>,
  ): Promise<ApiResponse<TData>>;

  put<TData, TBody = unknown>(
    path: string,
    config?: Omit<ApiRequestConfig<TBody>, 'method' | 'path'>,
  ): Promise<ApiResponse<TData>>;

  patch<TData, TBody = unknown>(
    path: string,
    config?: Omit<ApiRequestConfig<TBody>, 'method' | 'path'>,
  ): Promise<ApiResponse<TData>>;

  del<TData>(
    path: string,
    config?: Omit<ApiRequestConfig, 'method' | 'path' | 'body'>,
  ): Promise<ApiResponse<TData>>;

  upload<TData>(
    path: string,
    formData: FormData,
    config?: Omit<ApiRequestConfig, 'method' | 'path' | 'body'>,
  ): Promise<ApiResponse<TData>>;

  download(
    path: string,
    config?: Omit<ApiRequestConfig, 'method' | 'path' | 'body' | 'responseType'>,
  ): Promise<ApiResponse<Blob>>;

  stream(
    path: string,
    config?: Omit<ApiRequestConfig, 'method' | 'path' | 'body' | 'responseType'>,
  ): Promise<ApiResponse<ReadableStream<Uint8Array>>>;
}
