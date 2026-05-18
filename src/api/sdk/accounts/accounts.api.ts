/**
 * Account SDK module — typed API operations for the accounts domain.
 */

import type { ApiClient, ApiResponse } from '@/api/types';
import type { Account, AccountList, AccountSummary } from '@/api/schemas';
import { AccountSchema, AccountListSchema, AccountSummarySchema } from '@/api/schemas';
import type { ZodType } from 'zod';

export interface AccountsApi {
  getById(id: string): Promise<ApiResponse<Account>>;
  list(filters?: { status?: string; type?: string; cursor?: string; limit?: number }): Promise<ApiResponse<AccountList>>;
  getSummary(): Promise<ApiResponse<AccountSummary[]>>;
}

export function createAccountsApi(client: ApiClient): AccountsApi {
  return {
    getById: (id: string) =>
      client.get<Account>('/accounts/{id}', {
        params: { id },
        schema: AccountSchema as unknown as ZodType,
      }),

    list: (filters) =>
      client.get<AccountList>('/accounts', {
        query: filters,
        schema: AccountListSchema as unknown as ZodType,
      }),

    getSummary: () =>
      client.get<AccountSummary[]>('/accounts/summary', {
        schema: AccountSummarySchema.array() as unknown as ZodType,
      }),
  };
}
