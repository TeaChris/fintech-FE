/**
 * Zod schemas for Transfer domain.
 *
 * All monetary fields are string-based — never float.
 * Transfers are financial mutations and receive special treatment
 * in the retry engine (never auto-retried).
 */

import { z } from 'zod';
import { IdSchema, MoneySchema, PositiveMoneySchema, TimestampSchema, createCursorPaginationSchema } from './common.schema';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const TransferStatusSchema = z.enum([
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'REVERSED',
  'CANCELLED',
  'PENDING_APPROVAL',
  'FRAUD_REVIEW',
]);
export type TransferStatus = z.infer<typeof TransferStatusSchema>;

export const TransferTypeSchema = z.enum([
  'INTRA_BANK',
  'INTER_BANK',
  'INTERNATIONAL',
]);
export type TransferType = z.infer<typeof TransferTypeSchema>;

// ---------------------------------------------------------------------------
// Transfer Schema
// ---------------------------------------------------------------------------

export const TransferSchema = z.object({
  id: IdSchema,
  reference: z.string().min(1),
  type: TransferTypeSchema,
  status: TransferStatusSchema,

  /** All monetary fields are string-based */
  amount: MoneySchema,
  fee: MoneySchema,
  total: MoneySchema,

  sourceAccountId: IdSchema,
  sourceAccountNumber: z.string(),
  sourceAccountName: z.string(),

  destinationAccountNumber: z.string().min(1),
  destinationAccountName: z.string().min(1),
  destinationBankCode: z.string().optional(),
  destinationBankName: z.string().optional(),

  narration: z.string().max(100).optional(),
  remark: z.string().optional(),

  /** Idempotency key used for this transfer */
  idempotencyKey: z.string().optional(),

  createdAt: TimestampSchema,
  completedAt: TimestampSchema.optional(),
});
export type Transfer = z.infer<typeof TransferSchema>;

// ---------------------------------------------------------------------------
// Transfer Request (for creating a new transfer)
// ---------------------------------------------------------------------------

export const TransferRequestSchema = z.object({
  sourceAccountId: IdSchema,
  destinationAccountNumber: z.string().min(10).max(10),
  destinationBankCode: z.string().min(3).max(10),
  amount: PositiveMoneySchema,
  narration: z.string().max(100).optional(),
  pin: z.string().min(4).max(6).regex(/^\d{4,6}$/, 'PIN must be 4-6 digits'),
});
export type TransferRequest = z.infer<typeof TransferRequestSchema>;

// ---------------------------------------------------------------------------
// Transfer List
// ---------------------------------------------------------------------------

export const TransferListSchema = createCursorPaginationSchema(TransferSchema);
export type TransferList = z.infer<typeof TransferListSchema>;

// ---------------------------------------------------------------------------
// Name Enquiry
// ---------------------------------------------------------------------------

export const NameEnquiryRequestSchema = z.object({
  accountNumber: z.string().min(10).max(10),
  bankCode: z.string().min(3),
});

export const NameEnquiryResponseSchema = z.object({
  accountName: z.string(),
  accountNumber: z.string(),
  bankCode: z.string(),
  bankName: z.string().optional(),
});
export type NameEnquiryResponse = z.infer<typeof NameEnquiryResponseSchema>;
