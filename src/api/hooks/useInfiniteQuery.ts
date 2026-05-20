"use client";

/**
 * Typed TanStack useInfiniteQuery wrapper for paginated endpoints.
 *
 * Supports both cursor-based and offset-based pagination.
 */

import {
      useInfiniteQuery,
      // type UseInfiniteQueryOptions,
      type UseInfiniteQueryResult,
      type QueryKey,
      type InfiniteData,
} from "@tanstack/react-query";
import type { ZodType } from "zod";
import type {
      ApiClient,
      ApiResponse,
      CursorPaginatedResponse,
      OffsetPaginatedResponse,
} from "@/api/types";

// ---------------------------------------------------------------------------
// Cursor-Based Infinite Query
// ---------------------------------------------------------------------------

export interface UseCursorInfiniteQueryOptions<TItem> {
      /** TanStack Query key */
      queryKey: QueryKey;

      /** API client instance */
      client: ApiClient;

      /** API path */
      path: string;

      /** Zod schema for the full paginated response */
      schema?: ZodType<CursorPaginatedResponse<TItem>>;

      /** Additional query parameters */
      query?: Record<string, string | number | boolean | undefined>;

      /** Items per page. Default: 20 */
      pageSize?: number;

      /** Override stale time */
      staleTime?: number;

      /** Whether enabled */
      enabled?: boolean;

      /** Custom headers */
      headers?: Record<string, string>;
}

/**
 * Infinite query hook for cursor-based pagination.
 *
 * @example
 * ```tsx
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useCursorInfiniteQuery({
 *   queryKey: queryKeys.transactions.list({ accountId }),
 *   client: apiClient,
 *   path: '/transactions',
 *   schema: TransactionListSchema,
 *   query: { accountId },
 *   pageSize: 20,
 * });
 *
 * // Flatten all pages
 * const allTransactions = data?.pages.flatMap(page => page.data) ?? [];
 * ```
 */
export function useCursorInfiniteQuery<TItem>(
      options: UseCursorInfiniteQueryOptions<TItem>,
): UseInfiniteQueryResult<InfiniteData<CursorPaginatedResponse<TItem>>, Error> {
      const {
            queryKey,
            client,
            path,
            schema,
            query: queryParams,
            pageSize = 20,
            staleTime,
            enabled = true,
            headers,
      } = options;

      return useInfiniteQuery<
            CursorPaginatedResponse<TItem>,
            Error,
            InfiniteData<CursorPaginatedResponse<TItem>>,
            QueryKey,
            string | null
      >({
            queryKey,
            queryFn: async ({
                  signal,
                  pageParam,
            }): Promise<CursorPaginatedResponse<TItem>> => {
                  const response: ApiResponse<CursorPaginatedResponse<TItem>> =
                        await client.get(path, {
                              query: {
                                    ...queryParams,
                                    cursor: pageParam ?? undefined,
                                    limit: pageSize,
                              },
                              schema: schema as ZodType | undefined,
                              signal,
                              headers,
                        });

                  return response.data;
            },
            initialPageParam: null,
            getNextPageParam: (lastPage) => {
                  return lastPage.hasMore ? lastPage.cursor : undefined;
            },
            staleTime,
            enabled,
      });
}

// ---------------------------------------------------------------------------
// Offset-Based Infinite Query
// ---------------------------------------------------------------------------

export interface UseOffsetInfiniteQueryOptions<TItem> {
      /** TanStack Query key */
      queryKey: QueryKey;

      /** API client instance */
      client: ApiClient;

      /** API path */
      path: string;

      /** Zod schema for the full paginated response */
      schema?: ZodType<OffsetPaginatedResponse<TItem>>;

      /** Additional query parameters */
      query?: Record<string, string | number | boolean | undefined>;

      /** Items per page. Default: 20 */
      pageSize?: number;

      /** Override stale time */
      staleTime?: number;

      /** Whether enabled */
      enabled?: boolean;

      /** Custom headers */
      headers?: Record<string, string>;
}

/**
 * Infinite query hook for offset-based pagination.
 */
export function useOffsetInfiniteQuery<TItem>(
      options: UseOffsetInfiniteQueryOptions<TItem>,
): UseInfiniteQueryResult<InfiniteData<OffsetPaginatedResponse<TItem>>, Error> {
      const {
            queryKey,
            client,
            path,
            schema,
            query: queryParams,
            pageSize = 20,
            staleTime,
            enabled = true,
            headers,
      } = options;

      return useInfiniteQuery<
            OffsetPaginatedResponse<TItem>,
            Error,
            InfiniteData<OffsetPaginatedResponse<TItem>>,
            QueryKey,
            number
      >({
            queryKey,
            queryFn: async ({
                  signal,
                  pageParam,
            }): Promise<OffsetPaginatedResponse<TItem>> => {
                  const response: ApiResponse<OffsetPaginatedResponse<TItem>> =
                        await client.get(path, {
                              query: {
                                    ...queryParams,
                                    page: pageParam,
                                    pageSize,
                              },
                              schema: schema as ZodType | undefined,
                              signal,
                              headers,
                        });

                  return response.data;
            },
            initialPageParam: 1,
            getNextPageParam: (lastPage) => {
                  return lastPage.page < lastPage.totalPages
                        ? lastPage.page + 1
                        : undefined;
            },
            staleTime,
            enabled,
      });
}
