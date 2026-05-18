/**
 * Hierarchical query key factory.
 *
 * Design decisions:
 * - Hierarchical keys enable surgical cache invalidation
 * - `as const` ensures type-safe key comparisons
 * - Each domain has: all → lists → list(filters) → details → detail(id)
 * - Invalidating `accounts.all` cascades to lists and details
 * - Keys are serializable (no functions or objects as keys)
 */

// ---------------------------------------------------------------------------
// Query Key Factory
// ---------------------------------------------------------------------------

export const queryKeys = {
  /** Account domain keys */
  accounts: {
    all: ['accounts'] as const,
    lists: () => [...queryKeys.accounts.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.accounts.lists(), filters ?? {}] as const,
    details: () => [...queryKeys.accounts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.accounts.details(), id] as const,
    summary: () => [...queryKeys.accounts.all, 'summary'] as const,
  },

  /** Transaction domain keys */
  transactions: {
    all: ['transactions'] as const,
    lists: () => [...queryKeys.transactions.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.transactions.lists(), filters ?? {}] as const,
    details: () => [...queryKeys.transactions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.transactions.details(), id] as const,
    byAccount: (accountId: string) =>
      [...queryKeys.transactions.all, 'byAccount', accountId] as const,
  },

  /** Transfer domain keys */
  transfers: {
    all: ['transfers'] as const,
    lists: () => [...queryKeys.transfers.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.transfers.lists(), filters ?? {}] as const,
    details: () => [...queryKeys.transfers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.transfers.details(), id] as const,
    nameEnquiry: (accountNumber: string, bankCode: string) =>
      [...queryKeys.transfers.all, 'nameEnquiry', accountNumber, bankCode] as const,
  },

  /** Card domain keys */
  cards: {
    all: ['cards'] as const,
    lists: () => [...queryKeys.cards.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.cards.lists(), filters ?? {}] as const,
    details: () => [...queryKeys.cards.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.cards.details(), id] as const,
    byAccount: (accountId: string) =>
      [...queryKeys.cards.all, 'byAccount', accountId] as const,
  },

  /** Auth domain keys */
  auth: {
    all: ['auth'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
    profile: () => [...queryKeys.auth.all, 'profile'] as const,
  },
} as const;

// ---------------------------------------------------------------------------
// Key Helpers
// ---------------------------------------------------------------------------

/**
 * Type for a query key — any readonly array of primitives/objects.
 */
export type QueryKey = readonly unknown[];

/**
 * Invalidate all queries within a domain.
 *
 * Usage with TanStack Query:
 * ```ts
 * queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
 * ```
 */
export function getDomainKey(domain: keyof typeof queryKeys): readonly string[] {
  return queryKeys[domain].all;
}
