/**
 * Barrel export for the API client core.
 */
export { createApiClient } from './fetcher';
export { createApiClientConfig, STALE_TIMES, DEFAULT_RETRY_CONFIG, DEFAULT_AUTH_CONFIG } from './config';

// Errors
export {
  ApiError,
  AuthError,
  PermissionError,
  ValidationError,
  NetworkError,
  TimeoutError,
  RateLimitError,
  ConflictError,
  FraudReviewError,
  UnknownServerError,
  mapResponseToError,
  isApiError,
  isAuthError,
  isPermissionError,
  isValidationError,
  isNetworkError,
  isTimeoutError,
  isRateLimitError,
  isConflictError,
  isFraudReviewError,
  isRetryableError,
} from './errors';
export type { ApiErrorMeta, ErrorMapperContext } from './errors';

// Auth
export { createAuthCoordinator, createRefreshFn, extractCsrfToken } from './auth';
export type { AuthCoordinator } from './auth';

// Middleware
export {
  composeMiddleware,
  createTracingMiddleware,
  createAuthMiddleware,
  createIdempotencyMiddleware,
  createDefaultHeadersMiddleware,
  createLoggingMiddleware,
  buildMiddlewarePipeline,
} from './middleware';

// Logging
export {
  noopLogger,
  createLogger,
  createConsoleHandler,
  createBatchHandler,
  redactSensitiveFields,
  redactHeaders,
} from './logging';

// Tracing
export {
  generateRequestId,
  generateCorrelationId,
  buildTracingHeaders,
  getTimestamp,
  calculateDuration,
  noopTracingHook,
  TRACING_HEADERS,
} from './tracing';
export type { TracingHook, OTelSpanAttributes } from './tracing';

// Retry
export { executeWithRetry, shouldRetry, calculateBackoff } from './retry';

// Timeout
export { createTimeoutController, isTimeoutAbort, isUserAbort } from './timeout';

// Idempotency
export { generateIdempotencyKey, resolveIdempotencyKey, IDEMPOTENCY_KEY_HEADER } from './idempotency';

// Serialization
export { safeStringify, safeParse, safeReplacer, safeReviver, serializeBody } from './serialization';

// Validation
export { parseResponse, safeParseResponse, validatePayload } from './validation';
export type { SafeParseResult } from './validation';

// Request / Response
export { buildRequestUrl, interpolatePath, buildQueryString, mergeHeaders, buildFetchInit } from './request';
export { buildApiResponse, detectResponseType, parseResponseBody, buildResponseMeta } from './response';
