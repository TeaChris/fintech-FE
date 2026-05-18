'use client';

/**
 * Typed TanStack useMutation wrapper integrated with the API client SDK.
 *
 * Design decisions:
 * - Optimistic update support with automatic rollback
 * - Cache invalidation helpers
 * - Idempotency key auto-generation
 * - Financial mutation flag (prevents auto-retry)
 * - Error mapping to typed domain errors
 */

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
  type UseMutationResult,
  type QueryKey,
} from '@tanstack/react-query';
import type { ZodType } from 'zod';
import type { ApiClient, ApiResponse, HttpMethod } from '@/api/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseApiMutationOptions<TData, TVariables> {
  /** API client instance */
  client: ApiClient;

  /** API path (e.g. '/transfers') */
  path: string;

  /** HTTP method. Default: 'POST' */
  method?: Extract<HttpMethod, 'POST' | 'PUT' | 'PATCH' | 'DELETE'>;

  /** Zod schema for response validation */
  schema?: ZodType<TData>;

  /**
   * Whether this is a financial mutation (e.g. money transfer).
   * Financial mutations are NEVER auto-retried.
   * Default: false
   */
  isFinancialMutation?: boolean;

  /** Explicit idempotency key (auto-generated if not provided) */
  idempotencyKey?: string;

  /** Override default timeout (ms) */
  timeout?: number;

  /** Custom headers */
  headers?: Record<string, string>;

  /** Path parameters */
  params?: Record<string, string | number>;

  /**
   * Query keys to invalidate after successful mutation.
   * Accepts individual keys or arrays of keys.
   */
  invalidateKeys?: QueryKey[];

  /**
   * Optimistic update configuration.
   * Provides the query key and updater function for immediate UI updates.
   */
  optimistic?: {
    /** Query key to update optimistically */
    queryKey: QueryKey;
    /** Function to produce the optimistic data from variables */
    updater: (oldData: unknown, variables: TVariables) => unknown;
  };

  /** TanStack mutation callbacks */
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Typed API mutation hook.
 *
 * @example
 * ```tsx
 * const transfer = useApiMutation<Transfer, TransferRequest>({
 *   client: apiClient,
 *   path: '/transfers',
 *   method: 'POST',
 *   schema: TransferSchema,
 *   isFinancialMutation: true,
 *   invalidateKeys: [queryKeys.accounts.all, queryKeys.transfers.all],
 *   onSuccess: (data) => {
 *     toast.success(`Transfer ${data.reference} completed`);
 *   },
 * });
 *
 * transfer.mutate({ sourceAccountId: '...', amount: { amount: '1000', currency: 'NGN' } });
 * ```
 */
export function useApiMutation<TData, TVariables = void>(
  options: UseApiMutationOptions<TData, TVariables>,
): UseMutationResult<TData, Error, TVariables> {
  const queryClient = useQueryClient();

  const {
    client,
    path,
    method = 'POST',
    schema,
    isFinancialMutation = false,
    idempotencyKey,
    timeout,
    headers,
    params,
    invalidateKeys,
    optimistic,
    onSuccess,
    onError,
    onSettled,
  } = options;

  const mutationOptions: UseMutationOptions<TData, Error, TVariables> = {
    mutationFn: async (variables: TVariables): Promise<TData> => {
      const requestConfig = {
        body: variables,
        schema: schema as ZodType | undefined,
        isFinancialMutation,
        idempotencyKey,
        timeout,
        headers,
        params,
      };

      let response: ApiResponse<TData>;

      switch (method) {
        case 'POST':
          response = await client.post<TData>(path, requestConfig);
          break;
        case 'PUT':
          response = await client.put<TData>(path, requestConfig);
          break;
        case 'PATCH':
          response = await client.patch<TData>(path, requestConfig);
          break;
        case 'DELETE':
          response = await client.del<TData>(path, requestConfig);
          break;
        default: {
          const _exhaustive: never = method;
          throw new Error(`Unsupported mutation method: ${_exhaustive}`);
        }
      }

      return response.data;
    },

    onMutate: async (variables: TVariables) => {
      // Optimistic update
      if (optimistic) {
        // Cancel in-flight queries to prevent overwriting optimistic data
        await queryClient.cancelQueries({ queryKey: optimistic.queryKey });

        // Snapshot the previous value
        const previousData = queryClient.getQueryData(optimistic.queryKey);

        // Optimistically update the cache
        queryClient.setQueryData(
          optimistic.queryKey,
          (old: unknown) => optimistic.updater(old, variables),
        );

        // Return snapshot for rollback
        return { previousData };
      }

      return undefined;
    },

    onError: (error, variables, context) => {
      // Rollback optimistic update on error
      if (optimistic && context && typeof context === 'object' && 'previousData' in context) {
        queryClient.setQueryData(
          optimistic.queryKey,
          (context as { previousData: unknown }).previousData,
        );
      }

      onError?.(error, variables);
    },

    onSuccess: async (data, variables) => {
      // Invalidate related queries
      if (invalidateKeys) {
        await Promise.all(
          invalidateKeys.map((key) =>
            queryClient.invalidateQueries({ queryKey: key }),
          ),
        );
      }

      onSuccess?.(data, variables);
    },

    onSettled: (data, error, variables) => {
      onSettled?.(data, error, variables);
    },
  };

  return useMutation(mutationOptions);
}
