/**
 * Barrel export for the API client core.
 */
export { createApiClient } from './fetcher'
export {
      STALE_TIMES,
      DEFAULT_AUTH_CONFIG,
      DEFAULT_RETRY_CONFIG,
      createApiClientConfig,
} from './config'

// Errors
export {
      ApiError,
      AuthError,
      isApiError,
      isAuthError,
      NetworkError,
      TimeoutError,
      ConflictError,
      RateLimitError,
      isNetworkError,
      PermissionError,
      isTimeoutError,
      ValidationError,
      isConflictError,
      isRateLimitError,
      FraudReviewError,
      isRetryableError,
      isValidationError,
      isPermissionError,
      mapResponseToError,
      UnknownServerError,
      isFraudReviewError,
} from './errors'
export type { ApiErrorMeta, ErrorMapperContext } from './errors'

// Auth
export {
      createRefreshFn,
      extractCsrfToken,
      createAuthCoordinator,
} from './auth'
export type { AuthCoordinator } from './auth'

// Middleware
export {
      composeMiddleware,
      createAuthMiddleware,
      createLoggingMiddleware,
      buildMiddlewarePipeline,
      createTracingMiddleware,
      createIdempotencyMiddleware,
      createDefaultHeadersMiddleware,
} from './middleware'

// Logging
export {
      noopLogger,
      createLogger,
      redactHeaders,
      createBatchHandler,
      createConsoleHandler,
      redactSensitiveFields,
} from './logging'

// Tracing
export {
      getTimestamp,
      noopTracingHook,
      TRACING_HEADERS,
      generateRequestId,
      calculateDuration,
      buildTracingHeaders,
      generateCorrelationId,
} from './tracing'
export type { TracingHook, OTelSpanAttributes } from './tracing'

// Retry
export { executeWithRetry, shouldRetry, calculateBackoff } from './retry'

// Timeout
export { createTimeoutController, isTimeoutAbort, isUserAbort } from './timeout'

// Idempotency
export {
      generateIdempotencyKey,
      resolveIdempotencyKey,
      IDEMPOTENCY_KEY_HEADER,
} from './idempotency'

// Serialization
export {
      safeParse,
      safeReviver,
      safeReplacer,
      serializeBody,
      safeStringify,
} from './serialization'

// Validation
export { parseResponse, safeParseResponse, validatePayload } from './validation'
export type { SafeParseResult } from './validation'

// Request / Response
export {
      mergeHeaders,
      buildFetchInit,
      interpolatePath,
      buildRequestUrl,
      buildQueryString,
} from './request'
export {
      buildApiResponse,
      detectResponseType,
      parseResponseBody,
      buildResponseMeta,
} from './response'
