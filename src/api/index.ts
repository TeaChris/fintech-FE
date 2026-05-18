/**
 * Top-level barrel export for the entire API SDK.
 *
 * Import paths:
 * - `@/api`           — this file (everything)
 * - `@/api/client`    — core client, errors, middleware
 * - `@/api/hooks`     — TanStack Query hooks, provider
 * - `@/api/schemas`   — Zod schemas for all domains
 * - `@/api/sdk/*`     — domain-specific SDK modules
 * - `@/api/server`    — SSR utilities (server-only)
 * - `@/api/types`     — TypeScript type definitions
 */

// Client core
export { createApiClient } from './client';
export { createApiClientConfig, STALE_TIMES } from './client';
export type { ApiClient, ApiClientConfig, ApiResponse, ApiRequestConfig } from './types';

// Errors
export {
  ApiError,
  AuthError,
  ValidationError,
  NetworkError,
  TimeoutError,
  RateLimitError,
  isApiError,
  isAuthError,
  isValidationError,
  isNetworkError,
  isTimeoutError,
  isRetryableError,
} from './client';

// Hooks (client components only)
export { ApiProvider, useApiQuery, useApiMutation, useCursorInfiniteQuery, useOffsetInfiniteQuery, queryKeys } from './hooks';

// Schemas
export { MoneySchema, AccountSchema, TransactionSchema, TransferSchema, CardSchema } from './schemas';

// SDK modules
export { createAccountsApi } from './sdk/accounts';
export { createTransactionsApi } from './sdk/transactions';
export { createTransfersApi } from './sdk/transfers';
export { createCardsApi } from './sdk/cards';
export { createAuthApi } from './sdk/auth';
