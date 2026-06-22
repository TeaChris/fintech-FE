'use client'

/**
 * Typed TanStack useQuery wrapper integrated with the API client SDK.
 *
 * Design decisions:
 * - Full type inference from Zod schemas
 * - Auto-cancel via AbortSignal integration
 * - Error mapping to typed domain errors
 * - Suspense-compatible
 * - Configurable stale time per query
 */

import {
      useQuery,
      type UseQueryOptions,
      type UseQueryResult,
      type QueryKey,
} from '@tanstack/react-query'
import type { ZodType } from 'zod'
import type { ApiClient, ApiResponse } from '@/api/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Options for useApiQuery.
 *
 * Extends TanStack's UseQueryOptions with SDK-specific options.
 */
export interface UseApiQueryOptions<TData> {
      /** TanStack Query key */
      queryKey: QueryKey

      /** API client instance */
      client: ApiClient

      /** API path (e.g. '/accounts/{id}') */
      path: string

      /** Path parameters for URL interpolation */
      params?: Record<string, string | number>

      /** Query/search parameters */
      query?: Record<
            string,
            string | number | boolean | string[] | number[] | undefined
      >

      /** Zod schema for response validation */
      schema?: ZodType<TData>

      /** Override default stale time (ms) */
      staleTime?: number

      /** Whether this query is enabled */
      enabled?: boolean

      /** Override default timeout (ms) */
      timeout?: number

      /** Custom headers for this request */
      headers?: Record<string, string>

      /** Whether to skip auth for this request */
      skipAuth?: boolean

      /**
       * TanStack Query select function.
       * Transforms the data after fetching.
       */
      select?: (data: TData) => TData

      /** Refetch interval in ms (for polling) */
      refetchInterval?: number | false

      /** Whether to refetch on window focus */
      refetchOnWindowFocus?: boolean | 'always'
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Typed API query hook.
 *
 * Wraps TanStack's `useQuery` with full SDK integration:
 * - Zod schema validation
 * - Automatic AbortSignal cancellation
 * - Domain error typing
 * - Configurable stale time
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useApiQuery({
 *   queryKey: queryKeys.accounts.detail('123'),
 *   client: apiClient,
 *   path: '/accounts/{id}',
 *   params: { id: '123' },
 *   schema: AccountSchema,
 *   staleTime: STALE_TIMES.REALTIME,
 * });
 * ```
 */
export function useApiQuery<TData>(
      options: UseApiQueryOptions<TData>,
): UseQueryResult<TData, Error> {
      const {
            queryKey,
            client,
            path,
            params,
            query: queryParams,
            schema,
            staleTime,
            enabled = true,
            timeout,
            headers,
            skipAuth,
            select,
            refetchInterval,
            refetchOnWindowFocus,
      } = options

      const queryOptions: UseQueryOptions<TData, Error, TData, QueryKey> = {
            queryKey,
            queryFn: async ({ signal }): Promise<TData> => {
                  const response: ApiResponse<TData> = await client.get<TData>(
                        path,
                        {
                              params,
                              query: queryParams,
                              schema: schema as ZodType | undefined,
                              signal,
                              timeout,
                              headers,
                              skipAuth,
                        },
                  )

                  return response.data
            },
            enabled,
            staleTime,
            select,
            refetchInterval,
            refetchOnWindowFocus,
      }

      return useQuery(queryOptions)
}
