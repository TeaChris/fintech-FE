'use client'

/**
 * TanStack Query provider for the API client.
 *
 * Design decisions:
 * - `'use client'` — providers must be client components
 * - QueryClient created once per app lifetime (via useRef)
 * - Supports SSR hydration via ReactQueryDevtools
 * - Global error handler configurable via props
 */

import { useState, type ReactNode } from 'react'
import { createQueryClient } from './query-client'
import { QueryClientProvider } from '@tanstack/react-query'

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface ApiProviderProps {
      children: ReactNode
}

/**
 * API Provider — wraps the application with TanStack Query.
 *
 * Place this in your root layout:
 * ```tsx
 * // src/app/layout.tsx
 * import { ApiProvider } from '@/api/hooks';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <ApiProvider>{children}</ApiProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function ApiProvider({ children }: ApiProviderProps) {
      /**
       * Create QueryClient once per component lifecycle.
       * useState ensures it's only created once (not on every render).
       * This is the recommended pattern for Next.js App Router.
       */
      const [queryClient] = useState(() => createQueryClient())

      return (
            <QueryClientProvider client={queryClient}>
                  {children}
            </QueryClientProvider>
      )
}
