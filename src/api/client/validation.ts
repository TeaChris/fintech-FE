/**
 * Zod-based runtime validation utilities.
 *
 * Design decisions:
 * - ALL API responses are validated through Zod schemas
 * - Validation errors are mapped to our ValidationError class
 * - Both strict (throws) and safe (returns result) variants
 * - Mutation payloads are validated before sending
 * - Zod v4 compatible (latest)
 */

import type { ZodType, ZodError } from 'zod';
import { ValidationError } from './errors';

// ---------------------------------------------------------------------------
// Response Validation
// ---------------------------------------------------------------------------

/**
 * Parse and validate an API response body against a Zod schema.
 *
 * Throws a `ValidationError` if the data doesn't match the schema.
 * This is the primary validation path — used for all API responses.
 *
 * @param schema - Zod schema to validate against
 * @param data - Raw response data (usually from JSON parsing)
 * @param context - Optional context for error metadata
 * @returns Typed, validated data
 * @throws {ValidationError} if validation fails
 */
export function parseResponse<T>(
  schema: ZodType<T>,
  data: unknown,
  context?: {
    requestId?: string;
    correlationId?: string;
    url?: string;
    method?: string;
  },
): T {
  const result = schema.safeParse(data);

  if (result.success) {
    return result.data;
  }

  const fieldErrors = formatZodErrors(result.error);
  const message = `Response validation failed: ${summarizeZodError(result.error)}`;

  throw new ValidationError(
    message,
    {
      status: 0,
      requestId: context?.requestId ?? 'unknown',
      correlationId: context?.correlationId ?? 'unknown',
      method: (context?.method as 'GET') ?? 'GET',
      url: context?.url ?? 'unknown',
      retryable: false,
      retryCount: 0,
      durationMs: 0,
      code: 'RESPONSE_VALIDATION_FAILED',
      timestamp: new Date().toISOString(),
    },
    fieldErrors,
  );
}

/**
 * Safe variant of parseResponse that returns a discriminated union
 * instead of throwing.
 *
 * Useful for cases where validation failure is an expected possibility
 * and you want to handle it gracefully.
 */
export function safeParseResponse<T>(
  schema: ZodType<T>,
  data: unknown,
): SafeParseResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const fieldErrors = formatZodErrors(result.error);
  const message = `Response validation failed: ${summarizeZodError(result.error)}`;

  return {
    success: false,
    error: new ValidationError(
      message,
      {
        status: 0,
        requestId: 'unknown',
        correlationId: 'unknown',
        method: 'GET',
        url: 'unknown',
        retryable: false,
        retryCount: 0,
        durationMs: 0,
        code: 'RESPONSE_VALIDATION_FAILED',
        timestamp: new Date().toISOString(),
      },
      fieldErrors,
    ),
  };
}

/** Discriminated union result type for safe parsing */
export type SafeParseResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: ValidationError };

// ---------------------------------------------------------------------------
// Payload Validation
// ---------------------------------------------------------------------------

/**
 * Validate a mutation payload before sending it to the API.
 *
 * This catches validation errors at the client before wasting
 * a network round-trip. Throws `ValidationError` on failure.
 *
 * @param schema - Zod schema for the payload
 * @param payload - The data to validate
 * @returns Typed, validated payload
 * @throws {ValidationError} if validation fails
 */
export function validatePayload<T>(
  schema: ZodType<T>,
  payload: unknown,
): T {
  const result = schema.safeParse(payload);

  if (result.success) {
    return result.data;
  }

  const fieldErrors = formatZodErrors(result.error);
  const message = `Payload validation failed: ${summarizeZodError(result.error)}`;

  throw new ValidationError(
    message,
    {
      status: 0,
      requestId: 'client',
      correlationId: 'client',
      method: 'POST',
      url: 'client-validation',
      retryable: false,
      retryCount: 0,
      durationMs: 0,
      code: 'PAYLOAD_VALIDATION_FAILED',
      timestamp: new Date().toISOString(),
    },
    fieldErrors,
  );
}

// ---------------------------------------------------------------------------
// Zod Error Formatting
// ---------------------------------------------------------------------------

/**
 * Convert Zod errors to field-level error records.
 * Maps Zod's path-based errors to a flat key→messages structure.
 *
 * Example output:
 * ```
 * {
 *   "email": ["Invalid email format"],
 *   "amount": ["Expected string, received number"]
 * }
 * ```
 */
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.length > 0
      ? issue.path.join('.')
      : '_root';

    if (!fieldErrors[path]) {
      fieldErrors[path] = [];
    }

    fieldErrors[path].push(issue.message);
  }

  return fieldErrors;
}

/**
 * Create a human-readable summary of Zod validation errors.
 * Used for the error message string.
 */
function summarizeZodError(error: ZodError): string {
  const issues = error.issues.slice(0, 3);
  const summary = issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
      return `${path}: ${issue.message}`;
    })
    .join('; ');

  const remaining = error.issues.length - issues.length;

  if (remaining > 0) {
    return `${summary} (and ${remaining} more)`;
  }

  return summary;
}
