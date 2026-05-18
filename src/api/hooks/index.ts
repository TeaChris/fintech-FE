/**
 * Barrel export for API hooks.
 */

// Provider
export { ApiProvider } from './provider';

// Query Client
export { createQueryClient, createGlobalErrorHandler } from './query-client';

// Query Keys
export { queryKeys, getDomainKey } from './query-keys';
export type { QueryKey } from './query-keys';

// Hooks
export { useApiQuery } from './useQuery';
export type { UseApiQueryOptions } from './useQuery';

export { useApiMutation } from './useMutation';
export type { UseApiMutationOptions } from './useMutation';

export { useCursorInfiniteQuery, useOffsetInfiniteQuery } from './useInfiniteQuery';
export type { UseCursorInfiniteQueryOptions, UseOffsetInfiniteQueryOptions } from './useInfiniteQuery';
