/**
 * Zod schemas for Account domain.
 */

import { z } from 'zod'
import {
      IdSchema,
      MoneySchema,
      TimestampSchema,
      createCursorPaginationSchema,
} from './common.schema'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const AccountStatusSchema = z.enum([
      'ACTIVE',
      'FROZEN',
      'CLOSED',
      'INACTIVE',
      'PENDING_VERIFICATION',
])
export type AccountStatus = z.infer<typeof AccountStatusSchema>

export const AccountTypeSchema = z.enum([
      'SAVINGS',
      'CURRENT',
      'DOMICILIARY',
      'FIXED_DEPOSIT',
])
export type AccountType = z.infer<typeof AccountTypeSchema>

// ---------------------------------------------------------------------------
// Account Schema
// ---------------------------------------------------------------------------

export const AccountSchema = z.object({
      id: IdSchema,
      accountNumber: z.string().min(10).max(10),
      accountName: z.string().min(1),
      type: AccountTypeSchema,
      status: AccountStatusSchema,
      currency: z.string().length(3),

      /** All balances are string-based — never float */
      balance: MoneySchema,
      availableBalance: MoneySchema,
      ledgerBalance: MoneySchema,

      bankCode: z.string().optional(),
      bankName: z.string().optional(),
      branchCode: z.string().optional(),

      createdAt: TimestampSchema,
      updatedAt: TimestampSchema,
})
export type Account = z.infer<typeof AccountSchema>

// ---------------------------------------------------------------------------
// Account List
// ---------------------------------------------------------------------------

export const AccountListSchema = createCursorPaginationSchema(AccountSchema)
export type AccountList = z.infer<typeof AccountListSchema>

// ---------------------------------------------------------------------------
// Account Summary (lightweight)
// ---------------------------------------------------------------------------

export const AccountSummarySchema = z.object({
      id: IdSchema,
      accountNumber: z.string().min(10).max(10),
      accountName: z.string(),
      type: AccountTypeSchema,
      status: AccountStatusSchema,
      balance: MoneySchema,
})
export type AccountSummary = z.infer<typeof AccountSummarySchema>
