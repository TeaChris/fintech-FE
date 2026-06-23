/**
 * Zod schemas for Card domain.
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

export const CardStatusSchema = z.enum([
      'ACTIVE',
      'BLOCKED',
      'EXPIRED',
      'INACTIVE',
      'PENDING_ACTIVATION',
])
export type CardStatus = z.infer<typeof CardStatusSchema>

export const CardTypeSchema = z.enum(['DEBIT', 'CREDIT', 'PREPAID', 'VIRTUAL'])
export type CardType = z.infer<typeof CardTypeSchema>

export const CardNetworkSchema = z.enum(['VISA', 'MASTERCARD', 'VERVE'])
export type CardNetwork = z.infer<typeof CardNetworkSchema>

// ---------------------------------------------------------------------------
// Card Schema
// ---------------------------------------------------------------------------

export const CardSchema = z.object({
      id: IdSchema,
      type: CardTypeSchema,
      status: CardStatusSchema,
      network: CardNetworkSchema,

      /** Only the last 4 digits — never the full card number */
      maskedNumber: z
            .string()
            .regex(/^\*{4,}\d{4}$/, 'Must be masked with last 4 digits'),
      expiryMonth: z.number().int().min(1).max(12),
      expiryYear: z.number().int().min(2024),

      cardholderName: z.string().min(1),
      accountId: IdSchema,

      /** Spending limits as string-based money */
      dailyLimit: MoneySchema.optional(),
      monthlyLimit: MoneySchema.optional(),

      createdAt: TimestampSchema,
      updatedAt: TimestampSchema,
})
export type Card = z.infer<typeof CardSchema>

// ---------------------------------------------------------------------------
// Card List
// ---------------------------------------------------------------------------

export const CardListSchema = createCursorPaginationSchema(CardSchema)
export type CardList = z.infer<typeof CardListSchema>

// ---------------------------------------------------------------------------
// Card Actions
// ---------------------------------------------------------------------------

export const CardActivationSchema = z.object({
      cardId: IdSchema,
      pin: z
            .string()
            .length(4, 'PIN must be 4 digits')
            .regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
      cvv: z
            .string()
            .length(3, 'CVV must be 3 digits')
            .regex(/^\d{3}$/, 'CVV must be exactly 3 digits'),
      expiryMonth: z.number().int().min(1).max(12),
      expiryYear: z.number().int(),
})

export const CardBlockRequestSchema = z.object({
      cardId: IdSchema,
      reason: z.string().min(1).max(200),
})

export const CardLimitUpdateSchema = z.object({
      cardId: IdSchema,
      dailyLimit: MoneySchema.optional(),
      monthlyLimit: MoneySchema.optional(),
})
