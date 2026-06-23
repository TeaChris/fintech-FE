/**
 * Transaction SDK module — typed API operations for transactions.
 */

import type { ZodType } from 'zod'
import type { ApiClient, ApiResponse } from '@/api/types'
import type {
      Transaction,
      TransactionList,
      TransactionFilters,
} from '@/api/schemas'
import { TransactionSchema, TransactionListSchema } from '@/api/schemas'

export interface TransactionsApi {
      getById(id: string): Promise<ApiResponse<Transaction>>
      list(filters?: TransactionFilters): Promise<ApiResponse<TransactionList>>
      listByAccount(
            accountId: string,
            filters?: Omit<TransactionFilters, 'accountId'>,
      ): Promise<ApiResponse<TransactionList>>
}

export function createTransactionsApi(client: ApiClient): TransactionsApi {
      return {
            getById: (id: string) =>
                  client.get<Transaction>('/transactions/{id}', {
                        params: { id },
                        schema: TransactionSchema as unknown as ZodType,
                  }),

            list: (filters) =>
                  client.get<TransactionList>('/transactions', {
                        query: filters as Record<
                              string,
                              string | number | boolean | undefined
                        >,
                        schema: TransactionListSchema as unknown as ZodType,
                  }),

            listByAccount: (accountId, filters) =>
                  client.get<TransactionList>(
                        '/accounts/{accountId}/transactions',
                        {
                              params: { accountId },
                              query: filters as Record<
                                    string,
                                    string | number | boolean | undefined
                              >,
                              schema: TransactionListSchema as unknown as ZodType,
                        },
                  ),
      }
}
