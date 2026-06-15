/**
 * MSW request handlers — mock API responses for testing.
 *
 * These handlers simulate the PAY backend for integration tests.
 * All responses use the backend's envelope format:
 *   Success: { success: true, data: { ... } }
 *   Error:   { success: false, error: { code: "...", message: "..." } }
 *
 * All monetary values are string-based (matching the real API).
 */
import { http, HttpResponse } from 'msw'

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

export const TEST_ACCOUNT = {
      id: 'acc_001',
      accountNumber: '0123456789',
      accountName: 'John Doe Savings',
      type: 'SAVINGS',
      status: 'ACTIVE',
      currency: 'NGN',
      balance: { amount: '150000.50', currency: 'NGN' },
      availableBalance: { amount: '148000.00', currency: 'NGN' },
      ledgerBalance: { amount: '150000.50', currency: 'NGN' },
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-06-01T14:30:00Z',
}

export const TEST_TRANSACTION = {
      id: 'txn_001',
      reference: 'TXN-2024-001',
      type: 'CREDIT',
      status: 'COMPLETED',
      amount: { amount: '5000.00', currency: 'NGN' },
      accountId: 'acc_001',
      narration: 'Salary payment',
      createdAt: '2024-06-01T09:00:00Z',
}

export const TEST_TRANSFER = {
      id: 'tfr_001',
      reference: 'TFR-2024-001',
      type: 'INTRA_BANK',
      status: 'COMPLETED',
      amount: { amount: '10000.00', currency: 'NGN' },
      fee: { amount: '25.00', currency: 'NGN' },
      total: { amount: '10025.00', currency: 'NGN' },
      sourceAccountId: 'acc_001',
      sourceAccountNumber: '0123456789',
      sourceAccountName: 'John Doe',
      destinationAccountNumber: '9876543210',
      destinationAccountName: 'Jane Doe',
      createdAt: '2024-06-01T10:00:00Z',
      completedAt: '2024-06-01T10:00:05Z',
}

export const TEST_USER_PROFILE = {
      id: 'user_001',
      email: 'john@example.com',
      role: 'user',
      displayName: 'John Doe',
      emailVerified: true,
      mfaEnabled: false,
      createdAt: '2024-01-15T10:00:00Z',
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

const BASE = 'http://localhost:8000'

export const handlers = [
      // ---- Accounts ----
      http.get(`${BASE}/accounts/:id`, ({ params }) => {
            if (params.id === 'not-found') {
                  return HttpResponse.json(
                        {
                              success: false,
                              error: {
                                    code: 'NOT_FOUND',
                                    message: 'Account not found',
                              },
                        },
                        { status: 404 },
                  )
            }
            return HttpResponse.json({
                  success: true,
                  data: { ...TEST_ACCOUNT, id: params.id },
            })
      }),

      http.get(`${BASE}/accounts`, () => {
            return HttpResponse.json({
                  success: true,
                  data: {
                        data: [TEST_ACCOUNT],
                        cursor: null,
                        hasMore: false,
                        total: 1,
                  },
            })
      }),

      // ---- Transactions ----
      http.get(`${BASE}/transactions/:id`, ({ params }) => {
            return HttpResponse.json({
                  success: true,
                  data: { ...TEST_TRANSACTION, id: params.id },
            })
      }),

      http.get(`${BASE}/transactions`, () => {
            return HttpResponse.json({
                  success: true,
                  data: {
                        data: [TEST_TRANSACTION],
                        cursor: null,
                        hasMore: false,
                  },
            })
      }),

      // ---- Transfers ----
      http.post(`${BASE}/transfers`, async ({ request }) => {
            const body = (await request.json()) as Record<string, unknown>
            return HttpResponse.json({
                  success: true,
                  data: {
                        ...TEST_TRANSFER,
                        sourceAccountId: body.sourceAccountId,
                  },
            })
      }),

      http.get(`${BASE}/transfers/name-enquiry`, ({ request }) => {
            const url = new URL(request.url)
            const accountNumber = url.searchParams.get('accountNumber')
            return HttpResponse.json({
                  success: true,
                  data: {
                        accountName: 'Jane Doe',
                        accountNumber: accountNumber ?? '9876543210',
                        bankCode: '000',
                        bankName: 'Test Bank',
                  },
            })
      }),

      // ---- Auth ----
      http.post(`${BASE}/auth/login`, async ({ request }) => {
            const body = (await request.json()) as Record<string, unknown>
            if (body.password === 'wrong-password') {
                  return HttpResponse.json(
                        {
                              success: false,
                              error: {
                                    code: 'INVALID_CREDENTIALS',
                                    message: 'Invalid email or password',
                              },
                        },
                        { status: 401 },
                  )
            }
            return HttpResponse.json({
                  success: true,
                  data: { message: 'Login successful' },
            })
      }),

      http.post(`${BASE}/auth/register`, async ({ request }) => {
            const body = (await request.json()) as Record<string, unknown>
            return HttpResponse.json(
                  {
                        success: true,
                        data: {
                              message:
                                    'Registration successful. Please check your email to verify your account.',
                              userId: 'user_new_001',
                        },
                  },
                  { status: 201 },
            )
            // Suppress unused var — body is read to simulate real request parsing
            void body
      }),

      http.get(`${BASE}/auth/me`, () => {
            return HttpResponse.json({
                  success: true,
                  data: TEST_USER_PROFILE,
            })
      }),

      http.post(`${BASE}/auth/logout`, () => {
            return HttpResponse.json({
                  success: true,
                  data: { message: 'Logged out successfully' },
            })
      }),

      http.post(`${BASE}/auth/refresh`, () => {
            return HttpResponse.json({
                  success: true,
                  data: { message: 'Token refreshed' },
            })
      }),

      http.post(`${BASE}/auth/verify-email`, () => {
            return HttpResponse.json({
                  success: true,
                  data: { message: 'Email verified successfully' },
            })
      }),

      http.post(`${BASE}/auth/request-password-reset`, () => {
            return HttpResponse.json({
                  success: true,
                  data: {
                        message:
                              'If an account with that email exists, a password reset link has been sent.',
                  },
            })
      }),

      http.post(`${BASE}/auth/reset-password`, () => {
            return HttpResponse.json({
                  success: true,
                  data: {
                        message: 'Password has been reset successfully',
                  },
            })
      }),

      // ---- Error simulation endpoints ----
      http.get(`${BASE}/error/500`, () => {
            return HttpResponse.json(
                  {
                        success: false,
                        error: {
                              code: 'INTERNAL_ERROR',
                              message: 'Internal server error',
                        },
                  },
                  { status: 500 },
            )
      }),

      http.get(`${BASE}/error/429`, () => {
            return HttpResponse.json(
                  {
                        success: false,
                        error: {
                              code: 'RATE_LIMIT_EXCEEDED',
                              message: 'Too many requests',
                        },
                  },
                  { status: 429, headers: { 'Retry-After': '30' } },
            )
      }),

      http.get(`${BASE}/error/422`, () => {
            return HttpResponse.json(
                  {
                        success: false,
                        error: {
                              code: 'VALIDATION_ERROR',
                              message: 'Validation failed',
                        },
                  },
                  { status: 422 },
            )
      }),
]
