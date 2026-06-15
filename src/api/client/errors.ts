/**
 * Normalized domain-level error hierarchy for the API client.
 *
 * Design principles:
 * - Every error preserves request ID, correlation ID, status code
 * - Every error knows if it is retryable
 * - Errors carry structured metadata (not just strings)
 * - Error mapper converts raw HTTP responses to domain errors
 * - No `any` types — all error properties are typed
 *
 * Error hierarchy:
 *   ApiError (base)
 *   ├── AuthError (401)
 *   ├── PermissionError (403)
 *   ├── ValidationError (400/422)
 *   ├── NetworkError (offline/DNS)
 *   ├── TimeoutError (AbortController timeout)
 *   ├── RateLimitError (429)
 *   ├── ConflictError (409)
 *   ├── FraudReviewError (fintech-specific)
 *   └── UnknownServerError (5xx)
 */

import type { ApiErrorResponse, HttpMethod } from "@/api/types";

// ---------------------------------------------------------------------------
// Error Metadata
// ---------------------------------------------------------------------------

/** Metadata attached to every API error for observability */
export interface ApiErrorMeta {
      /** HTTP status code (0 for network errors) */
      readonly status: number;

      /** Unique request ID */
      readonly requestId: string;

      /** Correlation ID for distributed tracing */
      readonly correlationId: string;

      /** HTTP method that triggered the error */
      readonly method: HttpMethod;

      /** URL that was requested */
      readonly url: string;

      /** Whether this error is safe to retry */
      readonly retryable: boolean;

      /** Number of retries already attempted */
      readonly retryCount: number;

      /** Duration of the request in ms */
      readonly durationMs: number;

      /** Raw error response body (if available) */
      readonly responseBody?: ApiErrorResponse;

      /** Backend error code (if provided) */
      readonly code?: string;

      /** Timestamp of when the error occurred */
      readonly timestamp: string;
}

// ---------------------------------------------------------------------------
// Base Error
// ---------------------------------------------------------------------------

/**
 * Base API error class.
 * All domain-specific errors extend this.
 */
export class ApiError extends Error {
      public readonly name: string = "ApiError";
      public readonly meta: ApiErrorMeta;

      constructor(message: string, meta: ApiErrorMeta) {
            super(message);
            this.meta = meta;

            // Maintain proper prototype chain for instanceof checks
            Object.setPrototypeOf(this, new.target.prototype);
      }

      /** HTTP status code */
      get status(): number {
            return this.meta.status;
      }

      /** Whether this error is retryable */
      get retryable(): boolean {
            return this.meta.retryable;
      }

      /** Request ID for support tickets */
      get requestId(): string {
            return this.meta.requestId;
      }

      /** Structured representation for logging */
      toJSON(): Record<string, unknown> {
            return {
                  name: this.name,
                  url: this.meta.url,
                  code: this.meta.code,
                  message: this.message,
                  status: this.meta.status,
                  method: this.meta.method,
                  timestamp: this.meta.timestamp,
                  requestId: this.meta.requestId,
                  retryable: this.meta.retryable,
                  durationMs: this.meta.durationMs,
                  retryCount: this.meta.retryCount,
                  correlationId: this.meta.correlationId,
            };
      }
}

// ---------------------------------------------------------------------------
// Domain Errors
// ---------------------------------------------------------------------------

/**
 * 401 Unauthorized — token expired, invalid, or missing.
 * Triggers the auth refresh flow before surfacing to the caller.
 */
export class AuthError extends ApiError {
      public override readonly name = "AuthError";

      constructor(message: string, meta: ApiErrorMeta) {
            super(message, { ...meta, retryable: false });
            Object.setPrototypeOf(this, new.target.prototype);
      }
}

/**
 * 403 Forbidden — user authenticated but lacks permission.
 * Not retryable; the user needs elevated privileges.
 */
export class PermissionError extends ApiError {
      public override readonly name = "PermissionError";

      constructor(message: string, meta: ApiErrorMeta) {
            super(message, { ...meta, retryable: false });
            Object.setPrototypeOf(this, new.target.prototype);
      }
}

/**
 * 400/422 Validation Error — request payload failed validation.
 * Includes field-level error details from the backend.
 */
export class ValidationError extends ApiError {
      public override readonly name = "ValidationError";

      /** Field-level validation errors */
      public readonly fieldErrors: Record<string, string[]>;

      constructor(
            message: string,
            meta: ApiErrorMeta,
            fieldErrors: Record<string, string[]> = {},
      ) {
            super(message, { ...meta, retryable: false });
            this.fieldErrors = fieldErrors;
            Object.setPrototypeOf(this, new.target.prototype);
      }

      override toJSON(): Record<string, unknown> {
            return {
                  ...super.toJSON(),
                  fieldErrors: this.fieldErrors,
            };
      }
}

/**
 * Network error — offline, DNS failure, connection refused.
 * Retryable by default.
 */
export class NetworkError extends ApiError {
      public override readonly name = "NetworkError";

      constructor(
            message: string,
            meta: Partial<ApiErrorMeta> & {
                  requestId: string;
                  correlationId: string;
            },
      ) {
            super(message, {
                  status: 0,
                  method: "GET" as const,
                  url: "",
                  retryable: true,
                  retryCount: 0,
                  durationMs: 0,
                  timestamp: new Date().toISOString(),
                  ...meta,
            });
            Object.setPrototypeOf(this, new.target.prototype);
      }
}

/**
 * Timeout error — request exceeded the configured timeout.
 * Retryable by default (transient failure).
 */
export class TimeoutError extends ApiError {
      public override readonly name = "TimeoutError";

      constructor(
            message: string,
            meta: Partial<ApiErrorMeta> & {
                  requestId: string;
                  correlationId: string;
            },
      ) {
            super(message, {
                  status: 0,
                  method: "GET" as const,
                  url: "",
                  retryable: true,
                  retryCount: 0,
                  durationMs: 0,
                  timestamp: new Date().toISOString(),
                  ...meta,
            });
            Object.setPrototypeOf(this, new.target.prototype);
      }
}

/**
 * 429 Rate Limited — too many requests.
 * Retryable after the `retryAfter` period.
 */
export class RateLimitError extends ApiError {
      public override readonly name = "RateLimitError";

      /** Seconds to wait before retrying (from Retry-After header) */
      public readonly retryAfterSeconds: number;

      constructor(
            message: string,
            meta: ApiErrorMeta,
            retryAfterSeconds: number = 60,
      ) {
            super(message, { ...meta, retryable: true });
            this.retryAfterSeconds = retryAfterSeconds;
            Object.setPrototypeOf(this, new.target.prototype);
      }

      override toJSON(): Record<string, unknown> {
            return {
                  ...super.toJSON(),
                  retryAfterSeconds: this.retryAfterSeconds,
            };
      }
}

/**
 * 409 Conflict — resource state conflict (e.g. duplicate idempotency key).
 * Not retryable with the same payload.
 */
export class ConflictError extends ApiError {
      public override readonly name = "ConflictError";

      constructor(message: string, meta: ApiErrorMeta) {
            super(message, { ...meta, retryable: false });
            Object.setPrototypeOf(this, new.target.prototype);
      }
}

/**
 * Fraud review error — transaction flagged for manual review.
 * Fintech-specific error for compliance workflows.
 * Not retryable; requires human intervention.
 */
export class FraudReviewError extends ApiError {
      public override readonly name = "FraudReviewError";

      /** Reference ID for the fraud review case */
      public readonly reviewId?: string;

      constructor(message: string, meta: ApiErrorMeta, reviewId?: string) {
            super(message, { ...meta, retryable: false });
            this.reviewId = reviewId;
            Object.setPrototypeOf(this, new.target.prototype);
      }

      override toJSON(): Record<string, unknown> {
            return {
                  ...super.toJSON(),
                  reviewId: this.reviewId,
            };
      }
}

/**
 * 5xx Server Error — unexpected server failure.
 * Retryable by default (transient server issue).
 */
export class UnknownServerError extends ApiError {
      public override readonly name = "UnknownServerError";

      constructor(message: string, meta: ApiErrorMeta) {
            super(message, { ...meta, retryable: true });
            Object.setPrototypeOf(this, new.target.prototype);
      }
}

// ---------------------------------------------------------------------------
// Error Mapper
// ---------------------------------------------------------------------------

/** Context needed to construct error metadata */
export interface ErrorMapperContext {
      readonly url: string;
      readonly requestId: string;
      readonly retryCount: number;
      readonly durationMs: number;
      readonly method: HttpMethod;
      readonly correlationId: string;
}

/**
 * Parse the response body as an error payload.
 * Handles JSON and text responses gracefully.
 */
async function parseErrorBody(response: Response): Promise<ApiErrorResponse> {
      try {
            const contentType = response.headers.get("content-type") ?? "";

            if (contentType.includes("application/json")) {
                  const raw = (await response.json()) as Record<string, unknown>;

                  // Unwrap backend error envelope: { success: false, error: { code, message } }
                  if (
                        raw.success === false &&
                        raw.error !== null &&
                        typeof raw.error === "object"
                  ) {
                        const envelope = raw.error as Record<string, unknown>;
                        return {
                              code: envelope.code as string | undefined,
                              message: envelope.message as string | undefined,
                        };
                  }

                  return raw as unknown as ApiErrorResponse;
            }

            const text = await response.text();
            return { message: text || response.statusText };
      } catch {
            return { message: response.statusText || "Unknown error" };
      }
}

/**
 * Map an HTTP response to the appropriate domain error.
 *
 * This is the central error classification point.
 * Every non-2xx response passes through here.
 */
export async function mapResponseToError(
      response: Response,
      context: ErrorMapperContext,
): Promise<ApiError> {
      const body = await parseErrorBody(response);
      const timestamp = new Date().toISOString();

      const baseMeta: ApiErrorMeta = {
            status: response.status,
            requestId: body.requestId ?? context.requestId,
            correlationId: context.correlationId,
            method: context.method,
            url: context.url,
            retryable: false,
            retryCount: context.retryCount,
            durationMs: context.durationMs,
            responseBody: body,
            code: body.code,
            timestamp,
      };

      const message = body.message ?? body.error ?? `HTTP ${response.status}`;

      switch (response.status) {
            case 400:
            case 422:
                  return new ValidationError(message, baseMeta, body.fields);

            case 401:
                  return new AuthError(message, baseMeta);

            case 403:
                  return new PermissionError(message, baseMeta);

            case 409:
                  return new ConflictError(message, baseMeta);

            case 429: {
                  const retryAfterHeader = response.headers.get("retry-after");
                  let retryAfterSeconds = 60; // Safe default

                  if (retryAfterHeader) {
                        const parsed = parseInt(retryAfterHeader, 10);
                        if (!isNaN(parsed) && parsed > 0) {
                              // Retry-After is a delay-seconds value
                              retryAfterSeconds = parsed;
                        } else {
                              // Retry-After may be an HTTP-date (RFC 7231 §7.1.3)
                              const date = new Date(retryAfterHeader);
                              if (!isNaN(date.getTime())) {
                                    const deltaMs = date.getTime() - Date.now();
                                    retryAfterSeconds = Math.max(
                                          1,
                                          Math.ceil(deltaMs / 1000),
                                    );
                              }
                              // If neither parse succeeds, the 60s default is used
                        }
                  }

                  return new RateLimitError(
                        message,
                        baseMeta,
                        retryAfterSeconds,
                  );
            }

            default: {
                  // Check for fraud review (custom status or code)
                  if (body.code === "FRAUD_REVIEW" || response.status === 451) {
                        const reviewId =
                              typeof body.details?.["reviewId"] === "string"
                                    ? body.details["reviewId"]
                                    : undefined;
                        return new FraudReviewError(
                              message,
                              baseMeta,
                              reviewId,
                        );
                  }

                  // All 5xx errors are treated as server errors
                  if (response.status >= 500) {
                        return new UnknownServerError(message, {
                              ...baseMeta,
                              retryable: true,
                        });
                  }

                  // Fallback for any unhandled status codes
                  return new ApiError(message, baseMeta);
            }
      }
}

// ---------------------------------------------------------------------------
// Type Guards
// ---------------------------------------------------------------------------

export function isApiError(error: unknown): error is ApiError {
      return error instanceof ApiError;
}

export function isAuthError(error: unknown): error is AuthError {
      return error instanceof AuthError;
}

export function isPermissionError(error: unknown): error is PermissionError {
      return error instanceof PermissionError;
}

export function isValidationError(error: unknown): error is ValidationError {
      return error instanceof ValidationError;
}

export function isNetworkError(error: unknown): error is NetworkError {
      return error instanceof NetworkError;
}

export function isTimeoutError(error: unknown): error is TimeoutError {
      return error instanceof TimeoutError;
}

export function isRateLimitError(error: unknown): error is RateLimitError {
      return error instanceof RateLimitError;
}

export function isConflictError(error: unknown): error is ConflictError {
      return error instanceof ConflictError;
}

export function isFraudReviewError(error: unknown): error is FraudReviewError {
      return error instanceof FraudReviewError;
}

export function isRetryableError(error: unknown): boolean {
      if (isApiError(error)) {
            return error.retryable;
      }
      return false;
}
