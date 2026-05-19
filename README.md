# Frontend Architecture (Fintech API SDK)

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black)
![React](https://img.shields.io/badge/React-19.2-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![License](https://img.shields.io/badge/license-MIT-green)

A production-grade, highly resilient frontend architecture built with Next.js 16. At the core of this architecture is a bespoke, zero-dependency (using native `fetch`) API Client SDK tailored specifically for **fintech** applications. It prioritizes strict type safety, money-safe data serialization, observability, and robust error handling.

## ✨ Features

- **Money-Safe Serialization:** Custom JSON parsing guarantees that monetary values (like `balance`, `amount`, `fee`) are strictly treated as strings. This eliminates IEEE 754 floating-point precision errors critical in financial applications.
- **Advanced Resilience & Reliability:** 
  - Exponential backoff with jitter for transient network failures.
  - **Financial Mutation Safety:** Explicitly guards against auto-retrying non-idempotent financial POST requests.
  - AbortController-based timeout management with signal merging.
- **Comprehensive Error Architecture:** A 10-class domain-specific error hierarchy (e.g., `ApiError`, `AuthError`, `ValidationError`, `RateLimitError`) with automated HTTP response mapping and TypeScript type guards.
- **TanStack Query Integration:** Fully integrated with `@tanstack/react-query` providing hierarchical query keys for surgical cache invalidation, optimistic updates, and SSR hydration.
- **Edge & SSR Ready:** Strictly separates server and client concerns. Uses `server-only` guards, React `cache()` for request deduplication, and reads cookies from `next/headers` for secure auth forwarding in Server Components and Server Actions.
- **Robust Security:** Designed around `httpOnly` cookies for token storage, CSRF double-submit protection, and a singleton authentication refresh coordinator to handle concurrent 401 Unauthorized responses smoothly without race conditions.
- **Strict Boundary Validation:** Leverages Zod schemas for rigorous validation of all API payloads and responses.

## 🛠 Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **UI Library:** [React 19](https://react.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Data Fetching & State:** [@tanstack/react-query v5](https://tanstack.com/query/latest)
- **Validation:** [Zod](https://zod.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Testing:** [Vitest](https://vitest.dev/), [MSW](https://mswjs.io/) (Mock Service Worker), and React Testing Library

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your local machine:
- **Node.js** (v20 or higher recommended)
- **pnpm** (v9+ recommended, or npm/yarn)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/frontend-architecture.git
   cd frontend-architecture
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory based on `.env.example` (if available), or set the necessary variables:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
   ```

4. **Run the development server:**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Running Tests

Execute the unit and integration tests (which utilize MSW to mock backend responses) via Vitest:
```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

## 💻 Usage

### Server-Side Data Fetching (Server Components)

Use the server client to safely fetch data on the server, forwarding the user's cookies securely:

```tsx
import { getCachedServerClient } from '@/api/server';
import { AccountSchema } from '@/api/schemas';
import type { Account } from '@/api/schemas';

export default async function AccountDashboard({ params }: { params: { id: string } }) {
  const client = await getCachedServerClient();
  
  const { data: account } = await client.get<Account>('/accounts/{id}', {
    params: { id: params.id },
    schema: AccountSchema,
  });

  return <AccountDetails account={account} />;
}
```

### Client-Side Mutations

Use the integrated TanStack Query hooks for safe, typed mutations:

```tsx
'use client';
import { useApiMutation, queryKeys } from '@/api/hooks';
import { createTransfersApi } from '@/api/sdk/transfers';
import { useApiClient } from '@/api/client/context'; // Example context

export function TransferForm() {
  const client = useApiClient();
  const transfersApi = createTransfersApi(client);

  const transfer = useApiMutation({
    client,
    path: '/transfers',
    method: 'POST',
    // CRITICAL: Prevent auto-retry on financial mutations
    isFinancialMutation: true, 
    invalidateKeys: [queryKeys.accounts.all, queryKeys.transfers.all],
  });

  // ... handle submit
}
```

## 📖 API Reference

The core SDK logic is located in `src/api/`. 
- **`src/api/client/`**: Core fetcher, middleware, serialization, and error handling.
- **`src/api/hooks/`**: TanStack Query wrappers (`useApiQuery`, `useApiMutation`, etc.).
- **`src/api/schemas/`**: Zod domain definitions.
- **`src/api/sdk/`**: Domain-specific API wrappers (e.g., Accounts, Transactions).
- **`src/api/server/`**: SSR-specific utilities (`createServerClient`).

## 🤝 Contributing

We welcome contributions! Please follow these steps to contribute:

1. Fork the repository.
2. Create a new branch for your feature or bugfix (`git checkout -b feature/amazing-feature`).
3. Ensure your code follows the established guidelines and passes all type checks (`pnpm typecheck`) and tests (`pnpm test`).
4. Commit your changes with descriptive messages (`git commit -m 'feat: add amazing feature'`).
5. Push to the branch (`git push origin feature/amazing-feature`).
6. Open a Pull Request.

Please ensure you adhere to the architectural rules, especially regarding the strict separation of client/server code and financial mutation safety.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
