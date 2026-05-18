/**
 * Transfer SDK module — typed API operations for money transfers.
 *
 * CRITICAL: All transfer mutations are marked as `isFinancialMutation: true`
 * to prevent auto-retry by the retry engine.
 */

import type { ApiClient, ApiResponse } from '@/api/types';
import type { Transfer, TransferList, TransferRequest, NameEnquiryResponse } from '@/api/schemas';
import {
  TransferSchema,
  TransferListSchema,
  NameEnquiryResponseSchema,
} from '@/api/schemas';
import type { ZodType } from 'zod';

export interface TransfersApi {
  getById(id: string): Promise<ApiResponse<Transfer>>;
  list(filters?: { status?: string; cursor?: string; limit?: number }): Promise<ApiResponse<TransferList>>;
  create(data: TransferRequest): Promise<ApiResponse<Transfer>>;
  nameEnquiry(accountNumber: string, bankCode: string): Promise<ApiResponse<NameEnquiryResponse>>;
}

export function createTransfersApi(client: ApiClient): TransfersApi {
  return {
    getById: (id: string) =>
      client.get<Transfer>('/transfers/{id}', {
        params: { id },
        schema: TransferSchema as unknown as ZodType,
      }),

    list: (filters) =>
      client.get<TransferList>('/transfers', {
        query: filters,
        schema: TransferListSchema as unknown as ZodType,
      }),

    /**
     * Create a new transfer.
     *
     * SAFETY: Marked as financial mutation — will NOT be auto-retried.
     * Idempotency key is auto-generated to prevent duplicate transfers.
     */
    create: (data: TransferRequest) =>
      client.post<Transfer>('/transfers', {
        body: data,
        schema: TransferSchema as unknown as ZodType,
        isFinancialMutation: true,
      }),

    nameEnquiry: (accountNumber: string, bankCode: string) =>
      client.get<NameEnquiryResponse>('/transfers/name-enquiry', {
        query: { accountNumber, bankCode },
        schema: NameEnquiryResponseSchema as unknown as ZodType,
      }),
  };
}
