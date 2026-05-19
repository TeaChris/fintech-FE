/**
 * Tests for the retry engine.
 *
 * Covers:
 * - shouldRetry logic (method/status/financial guards)
 * - calculateBackoff (exponential + jitter + Retry-After)
 * - executeWithRetry (full integration)
 * - Financial mutation safety
 */
import { describe, it, expect, vi } from 'vitest';
import {
  shouldRetry,
  calculateBackoff,
  executeWithRetry,
} from '@/api/client/retry';
import { NetworkError, RateLimitError, TimeoutError, ValidationError } from '@/api/client/errors';
import type { RetryConfig } from '@/api/types';

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 100,
  maxDelay: 5000,
  jitterFactor: 0.3,
  retryableStatuses: [408, 500, 502, 503, 504],
  retryOnNetworkError: true,
};

describe('shouldRetry', () => {
  it('should NOT retry if max retries exceeded', () => {
    const error = new NetworkError('fail', { requestId: 'r', correlationId: 'c' });
    expect(shouldRetry(error, 3, DEFAULT_CONFIG, 'GET')).toBe(false);
  });

  it('should NOT auto-retry financial POST mutations', () => {
    const error = new NetworkError('fail', { requestId: 'r', correlationId: 'c' });
    expect(shouldRetry(error, 0, DEFAULT_CONFIG, 'POST', true)).toBe(false);
  });

  it('should retry GET requests on network errors', () => {
    const error = new NetworkError('fail', { requestId: 'r', correlationId: 'c' });
    expect(shouldRetry(error, 0, DEFAULT_CONFIG, 'GET')).toBe(true);
  });

  it('should retry on timeout errors', () => {
    const error = new TimeoutError('timeout', { requestId: 'r', correlationId: 'c' });
    expect(shouldRetry(error, 0, DEFAULT_CONFIG, 'GET')).toBe(true);
  });

  it('should NOT retry on validation errors', () => {
    const meta = {
      status: 400,
      requestId: 'r',
      correlationId: 'c',
      method: 'POST' as const,
      url: '/test',
      retryable: false,
      retryCount: 0,
      durationMs: 100,
      timestamp: new Date().toISOString(),
    };
    const error = new ValidationError('invalid', meta);
    expect(shouldRetry(error, 0, DEFAULT_CONFIG, 'POST')).toBe(false);
  });

  it('should retry on rate limit errors', () => {
    const meta = {
      status: 429,
      requestId: 'r',
      correlationId: 'c',
      method: 'GET' as const,
      url: '/test',
      retryable: true,
      retryCount: 0,
      durationMs: 100,
      timestamp: new Date().toISOString(),
    };
    const error = new RateLimitError('limited', meta, 30);
    expect(shouldRetry(error, 0, DEFAULT_CONFIG, 'GET')).toBe(true);
  });

  it('should NOT retry unknown errors', () => {
    const error = new Error('unknown');
    expect(shouldRetry(error, 0, DEFAULT_CONFIG, 'GET')).toBe(false);
  });
});

describe('calculateBackoff', () => {
  it('should use exponential base', () => {
    // With jitter, we check the range
    const delay0 = calculateBackoff(0, { ...DEFAULT_CONFIG, jitterFactor: 0 });
    const delay1 = calculateBackoff(1, { ...DEFAULT_CONFIG, jitterFactor: 0 });
    const delay2 = calculateBackoff(2, { ...DEFAULT_CONFIG, jitterFactor: 0 });

    expect(delay0).toBe(100);  // 100 * 2^0
    expect(delay1).toBe(200);  // 100 * 2^1
    expect(delay2).toBe(400);  // 100 * 2^2
  });

  it('should cap at maxDelay', () => {
    const delay = calculateBackoff(10, { ...DEFAULT_CONFIG, jitterFactor: 0 });
    expect(delay).toBe(DEFAULT_CONFIG.maxDelay);
  });

  it('should honor Retry-After for rate limit errors', () => {
    const meta = {
      status: 429,
      requestId: 'r',
      correlationId: 'c',
      method: 'GET' as const,
      url: '/test',
      retryable: true,
      retryCount: 0,
      durationMs: 100,
      timestamp: new Date().toISOString(),
    };
    const error = new RateLimitError('limited', meta, 30);
    const delay = calculateBackoff(0, DEFAULT_CONFIG, error);

    // Should be ~30000ms + some jitter
    expect(delay).toBeGreaterThanOrEqual(30000);
    expect(delay).toBeLessThanOrEqual(30000 + 30000 * DEFAULT_CONFIG.jitterFactor);
  });
});

describe('executeWithRetry', () => {
  it('should succeed on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await executeWithRetry(fn, DEFAULT_CONFIG);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on transient failure then succeed', async () => {
    const error = new NetworkError('fail', { requestId: 'r', correlationId: 'c' });
    const fn = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue('recovered');

    const result = await executeWithRetry(fn, { ...DEFAULT_CONFIG, baseDelay: 10 });
    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw after all retries exhausted', async () => {
    const error = new NetworkError('fail', { requestId: 'r', correlationId: 'c' });
    const fn = vi.fn().mockRejectedValue(error);

    await expect(
      executeWithRetry(fn, { ...DEFAULT_CONFIG, maxRetries: 2, baseDelay: 10 }),
    ).rejects.toThrow('fail');
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it('should abort when signal fires', async () => {
    const controller = new AbortController();
    const fn = vi.fn().mockImplementation(async () => {
      controller.abort();
      throw new NetworkError('fail', { requestId: 'r', correlationId: 'c' });
    });

    await expect(
      executeWithRetry(fn, DEFAULT_CONFIG, { signal: controller.signal }),
    ).rejects.toThrow();
  });

  it('should call onRetry callback', async () => {
    const error = new NetworkError('fail', { requestId: 'r', correlationId: 'c' });
    const onRetry = vi.fn();
    const fn = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue('ok');

    await executeWithRetry(fn, { ...DEFAULT_CONFIG, baseDelay: 10 }, { onRetry });
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, error, expect.any(Number));
  });
});
