/**
 * Shared Zod schemas used across multiple SDK modules.
 *
 * Design decisions:
 * - MoneySchema enforces string-only amounts (never number)
 * - Pagination schemas support both cursor and offset patterns
 * - All IDs are validated as non-empty strings
 * - Timestamps are ISO 8601 strings
 * - Reusable building blocks for domain schemas
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** UUID or opaque string ID — must be non-empty */
export const IdSchema = z.string().min(1, 'ID must not be empty');

/** ISO 8601 timestamp string */
export const TimestampSchema = z.string().datetime({ offset: true }).or(z.string().datetime());

/** ISO 4217 currency code (e.g. "NGN", "USD") */
export const CurrencyCodeSchema = z.string().length(3, 'Currency code must be 3 characters');

// ---------------------------------------------------------------------------
// Money Safety
// ---------------------------------------------------------------------------

/**
 * Money value schema.
 *
 * CRITICAL: `amount` is z.string(), never z.number().
 * IEEE 754 floating point is unsafe for financial calculations.
 *
 * Valid examples: "1234.56", "0.01", "1000000"
 * Invalid examples: 1234.56, "abc", ""
 */
export const MoneySchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount must not be empty')
    .regex(/^-?\d+(\.\d+)?$/, 'Amount must be a valid decimal string'),
  currency: CurrencyCodeSchema,
});

/** Inferred TypeScript type for MoneySchema */
export type Money = z.infer<typeof MoneySchema>;

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

/** Cursor-based pagination response envelope */
export function createCursorPaginationSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    cursor: z.string().nullable(),
    hasMore: z.boolean(),
    total: z.number().int().nonnegative().optional(),
  });
}

/** Offset-based pagination response envelope */
export function createOffsetPaginationSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
    totalItems: z.number().int().nonnegative(),
  });
}

/** Pagination request params (for query strings) */
export const CursorPaginationParamsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

export const OffsetPaginationParamsSchema = z.object({
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
});

// ---------------------------------------------------------------------------
// API Error Response
// ---------------------------------------------------------------------------

/** Standard error response from the backend */
export const ApiErrorResponseSchema = z.object({
  error: z.string().optional(),
  message: z.string().optional(),
  code: z.string().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
  requestId: z.string().optional(),
  retryAfter: z.number().optional(),
  fields: z.record(z.string(), z.array(z.string())).optional(),
});

// ---------------------------------------------------------------------------
// Common Envelopes
// ---------------------------------------------------------------------------

/** Single-item success response */
export function createSuccessSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    data: dataSchema,
    message: z.string().optional(),
  });
}

/** List response (non-paginated) */
export function createListSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    total: z.number().int().nonnegative().optional(),
  });
}

// ---------------------------------------------------------------------------
// Sort & Filter
// ---------------------------------------------------------------------------

export const SortOrderSchema = z.enum(['asc', 'desc']);

export const DateRangeSchema = z.object({
  from: TimestampSchema.optional(),
  to: TimestampSchema.optional(),
});
