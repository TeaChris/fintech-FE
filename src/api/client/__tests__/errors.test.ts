/**
 * Tests for the error hierarchy and error mapper.
 *
 * Covers:
 * - Error class instantiation and metadata
 * - Error mapper (mapResponseToError)
 * - Type guards (isApiError, isAuthError, etc.)
 * - Retryable flag accuracy
 */
import { describe, it, expect } from 'vitest';
import {
  ApiError,
  AuthError,
  PermissionError,
  ValidationError,
  NetworkError,
  TimeoutError,
  RateLimitError,
  ConflictError,
  FraudReviewError,
  UnknownServerError,
  mapResponseToError,
  isApiError,
  isAuthError,
  isNetworkError,
  isTimeoutError,
  isRateLimitError,
  isValidationError,
  isRetryableError,
} from '@/api/client/errors';

const baseMeta = {
  status: 400,
  requestId: 'req_001',
  correlationId: 'cor_001',
  method: 'GET' as const,
  url: '/test',
  retryable: false,
  retryCount: 0,
  durationMs: 100,
  timestamp: new Date().toISOString(),
};

describe('Error classes', () => {
  it('should create ApiError with metadata', () => {
    const error = new ApiError('test error', baseMeta);
    expect(error.message).toBe('test error');
    expect(error.status).toBe(400);
    expect(error.requestId).toBe('req_001');
    expect(error.retryable).toBe(false);
    expect(error.name).toBe('ApiError');
  });

  it('should create AuthError (not retryable)', () => {
    const error = new AuthError('unauthorized', { ...baseMeta, status: 401 });
    expect(error.name).toBe('AuthError');
    expect(error.retryable).toBe(false);
    expect(error instanceof ApiError).toBe(true);
  });

  it('should create ValidationError with field errors', () => {
    const fieldErrors = { email: ['required'], amount: ['must be positive'] };
    const error = new ValidationError('invalid', baseMeta, fieldErrors);
    expect(error.name).toBe('ValidationError');
    expect(error.fieldErrors).toEqual(fieldErrors);
  });

  it('should create NetworkError (retryable by default)', () => {
    const error = new NetworkError('offline', { requestId: 'r', correlationId: 'c' });
    expect(error.name).toBe('NetworkError');
    expect(error.retryable).toBe(true);
    expect(error.status).toBe(0);
  });

  it('should create TimeoutError (retryable by default)', () => {
    const error = new TimeoutError('timeout', { requestId: 'r', correlationId: 'c' });
    expect(error.name).toBe('TimeoutError');
    expect(error.retryable).toBe(true);
  });

  it('should create RateLimitError with retryAfterSeconds', () => {
    const error = new RateLimitError('limited', { ...baseMeta, status: 429 }, 60);
    expect(error.name).toBe('RateLimitError');
    expect(error.retryAfterSeconds).toBe(60);
    expect(error.retryable).toBe(true);
  });

  it('should serialize to JSON', () => {
    const error = new ApiError('test', baseMeta);
    const json = error.toJSON();
    expect(json.name).toBe('ApiError');
    expect(json.message).toBe('test');
    expect(json.requestId).toBe('req_001');
  });
});

describe('Type guards', () => {
  it('should identify ApiError', () => {
    const error = new ApiError('test', baseMeta);
    expect(isApiError(error)).toBe(true);
    expect(isApiError(new Error('plain'))).toBe(false);
  });

  it('should identify AuthError', () => {
    const error = new AuthError('unauth', baseMeta);
    expect(isAuthError(error)).toBe(true);
    expect(isApiError(error)).toBe(true); // Also an ApiError
  });

  it('should identify NetworkError', () => {
    const error = new NetworkError('offline', { requestId: 'r', correlationId: 'c' });
    expect(isNetworkError(error)).toBe(true);
  });

  it('should identify TimeoutError', () => {
    const error = new TimeoutError('timeout', { requestId: 'r', correlationId: 'c' });
    expect(isTimeoutError(error)).toBe(true);
  });

  it('should identify retryable errors', () => {
    expect(isRetryableError(new NetworkError('fail', { requestId: 'r', correlationId: 'c' }))).toBe(true);
    expect(isRetryableError(new AuthError('fail', baseMeta))).toBe(false);
    expect(isRetryableError(new Error('plain'))).toBe(false);
  });
});

describe('mapResponseToError', () => {
  const context = {
    requestId: 'req_001',
    correlationId: 'cor_001',
    method: 'GET' as const,
    url: '/test',
    retryCount: 0,
    durationMs: 50,
  };

  it('should map 401 to AuthError', async () => {
    const response = new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
    const error = await mapResponseToError(response, context);
    expect(isAuthError(error)).toBe(true);
    expect(error.status).toBe(401);
  });

  it('should map 403 to PermissionError', async () => {
    const response = new Response(JSON.stringify({ message: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
    const error = await mapResponseToError(response, context);
    expect(error.name).toBe('PermissionError');
  });

  it('should map 422 to ValidationError with fields', async () => {
    const body = {
      message: 'Validation failed',
      fields: { email: ['required'] },
    };
    const response = new Response(JSON.stringify(body), {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    });
    const error = await mapResponseToError(response, context);
    expect(isValidationError(error)).toBe(true);
    expect((error as ValidationError).fieldErrors).toEqual({ email: ['required'] });
  });

  it('should map 429 to RateLimitError with Retry-After', async () => {
    const response = new Response(JSON.stringify({ message: 'Rate limited' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': '30' },
    });
    const error = await mapResponseToError(response, context);
    expect(isRateLimitError(error)).toBe(true);
    expect((error as RateLimitError).retryAfterSeconds).toBe(30);
  });

  it('should map 500 to UnknownServerError (retryable)', async () => {
    const response = new Response(JSON.stringify({ message: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
    const error = await mapResponseToError(response, context);
    expect(error.name).toBe('UnknownServerError');
    expect(error.retryable).toBe(true);
  });

  it('should map 409 to ConflictError', async () => {
    const response = new Response(JSON.stringify({ message: 'Conflict' }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' },
    });
    const error = await mapResponseToError(response, context);
    expect(error.name).toBe('ConflictError');
  });
});
