/**
 * MSW request handlers — mock API responses for testing.
 *
 * These handlers simulate the backend for integration tests.
 * All monetary values are string-based (matching the real API).
 */
import { http, HttpResponse } from 'msw';

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
};

export const TEST_TRANSACTION = {
  id: 'txn_001',
  reference: 'TXN-2024-001',
  type: 'CREDIT',
  status: 'COMPLETED',
  amount: { amount: '5000.00', currency: 'NGN' },
  accountId: 'acc_001',
  narration: 'Salary payment',
  createdAt: '2024-06-01T09:00:00Z',
};

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
};

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

const BASE = 'http://localhost:3001/api';

export const handlers = [
  // ---- Accounts ----
  http.get(`${BASE}/accounts/:id`, ({ params }) => {
    if (params.id === 'not-found') {
      return HttpResponse.json(
        { message: 'Account not found', code: 'NOT_FOUND' },
        { status: 404 },
      );
    }
    return HttpResponse.json({ ...TEST_ACCOUNT, id: params.id });
  }),

  http.get(`${BASE}/accounts`, () => {
    return HttpResponse.json({
      data: [TEST_ACCOUNT],
      cursor: null,
      hasMore: false,
      total: 1,
    });
  }),

  // ---- Transactions ----
  http.get(`${BASE}/transactions/:id`, ({ params }) => {
    return HttpResponse.json({ ...TEST_TRANSACTION, id: params.id });
  }),

  http.get(`${BASE}/transactions`, () => {
    return HttpResponse.json({
      data: [TEST_TRANSACTION],
      cursor: null,
      hasMore: false,
    });
  }),

  // ---- Transfers ----
  http.post(`${BASE}/transfers`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      ...TEST_TRANSFER,
      sourceAccountId: body.sourceAccountId,
    });
  }),

  http.get(`${BASE}/transfers/name-enquiry`, ({ request }) => {
    const url = new URL(request.url);
    const accountNumber = url.searchParams.get('accountNumber');
    return HttpResponse.json({
      accountName: 'Jane Doe',
      accountNumber: accountNumber ?? '9876543210',
      bankCode: '000',
      bankName: 'Test Bank',
    });
  }),

  // ---- Auth ----
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    if (body.password === 'wrong-password') {
      return HttpResponse.json(
        { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' },
        { status: 401 },
      );
    }
    return HttpResponse.json({
      user: {
        id: 'user_001',
        email: body.email,
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer',
      },
      expiresAt: '2024-06-02T10:00:00Z',
    });
  }),

  http.post(`${BASE}/auth/logout`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${BASE}/auth/refresh`, () => {
    return new HttpResponse(null, { status: 200 });
  }),

  // ---- Error simulation endpoints ----
  http.get(`${BASE}/error/500`, () => {
    return HttpResponse.json(
      { message: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 },
    );
  }),

  http.get(`${BASE}/error/429`, () => {
    return HttpResponse.json(
      { message: 'Rate limited', code: 'RATE_LIMITED' },
      { status: 429, headers: { 'Retry-After': '30' } },
    );
  }),

  http.get(`${BASE}/error/422`, () => {
    return HttpResponse.json(
      {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        fields: { email: ['Email is required'], amount: ['Must be positive'] },
      },
      { status: 422 },
    );
  }),
];
