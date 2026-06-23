/**
 * Card SDK module — typed API operations for cards.
 */

import type { ZodType } from 'zod'
import type { Card, CardList } from '@/api/schemas'
import type { ApiClient, ApiResponse } from '@/api/types'
import { CardSchema, CardListSchema } from '@/api/schemas'

export interface CardsApi {
      getById(id: string): Promise<ApiResponse<Card>>
      list(filters?: {
            status?: string
            type?: string
            accountId?: string
      }): Promise<ApiResponse<CardList>>
      block(cardId: string, reason: string): Promise<ApiResponse<Card>>
      activate(data: {
            cardId: string
            pin: string
            cvv: string
            expiryMonth: number
            expiryYear: number
      }): Promise<ApiResponse<Card>>
}

export function createCardsApi(client: ApiClient): CardsApi {
      return {
            getById: (id: string) =>
                  client.get<Card>('/cards/{id}', {
                        params: { id },
                        schema: CardSchema as unknown as ZodType,
                  }),

            list: (filters) =>
                  client.get<CardList>('/cards', {
                        query: filters,
                        schema: CardListSchema as unknown as ZodType,
                  }),

            block: (cardId: string, reason: string) =>
                  client.post<Card>('/cards/{cardId}/block', {
                        params: { cardId },
                        body: { reason },
                        schema: CardSchema as unknown as ZodType,
                        isFinancialMutation: true,
                  }),

            activate: (data) =>
                  client.post<Card>('/cards/{cardId}/activate', {
                        params: { cardId: data.cardId },
                        body: {
                              pin: data.pin,
                              cvv: data.cvv,
                              expiryMonth: data.expiryMonth,
                              expiryYear: data.expiryYear,
                        },
                        schema: CardSchema as unknown as ZodType,
                        isFinancialMutation: true,
                  }),
      }
}
