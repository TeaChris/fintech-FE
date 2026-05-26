/**
 * Zod schemas for Transaction domain.
 */

import { z } from 'zod';
import { IdSchema, MoneySchema, TimestampSchema, createCursorPaginationSchema, DateRangeSchema, SortOrderSchema } from './common.schema';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const TransactionTypeSchema = z.enum([
  'CREDIT',
  'DEBIT',
  'REVERSAL',
  'FEE',
  'INTEREST',
  'TRANSFER',
]);
export type TransactionType = z.infer<typeof TransactionTypeSchema>;

export const TransactionStatusSchema = z.enum([
  'PENDING',
  'COMPLETED',
  'FAILED',
  'REVERSED',
  'PROCESSING',
]);
export type TransactionStatus = z.infer<typeof TransactionStatusSchema>;

export const TransactionChannelSchema = z.enum([
  'WEB',
  'MOBILE',
  'USSD',
  'ATM',
  'POS',
  'BRANCH',
  'API',
]);
export type TransactionChannel = z.infer<typeof TransactionChannelSchema>;

// ---------------------------------------------------------------------------
// Transaction Schema
// ---------------------------------------------------------------------------

export const TransactionSchema = z.object({
  id: IdSchema,
  reference: z.string().min(1),
  type: TransactionTypeSchema,
  status: TransactionStatusSchema,
  channel: TransactionChannelSchema.optional(),

  /** All monetary fields are string-based */
  amount: MoneySchema,
  fee: MoneySchema.optional(),
  total: MoneySchema.optional(),
  balanceAfter: MoneySchema.optional(),

  accountId: IdSchema,
  accountNumber: z.string().optional(),
  counterpartyName: z.string().optional(),
  counterpartyAccount: z.string().optional(),
  counterpartyBank: z.string().optional(),

  narration: z.string().optional(),
  remark: z.string().optional(),

  createdAt: TimestampSchema,
  completedAt: TimestampSchema.optional(),
});
export type Transaction = z.infer<typeof TransactionSchema>;

// ---------------------------------------------------------------------------
// Transaction List
// ---------------------------------------------------------------------------

export const TransactionListSchema = createCursorPaginationSchema(TransactionSchema);
export type TransactionList = z.infer<typeof TransactionListSchema>;

// ---------------------------------------------------------------------------
// Transaction Filters
// ---------------------------------------------------------------------------

export const TransactionFiltersSchema = z.object({
  accountId: IdSchema.optional(),
  type: TransactionTypeSchema.optional(),
  status: TransactionStatusSchema.optional(),
  channel: TransactionChannelSchema.optional(),
  dateRange: DateRangeSchema.optional(),
  minAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid positive decimal').optional(),
  maxAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid positive decimal').optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'amount', 'status']).optional(),
  sortOrder: SortOrderSchema.optional(),
});
export type TransactionFilters = z.infer<typeof TransactionFiltersSchema>;
