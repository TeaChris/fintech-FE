import { describe, it, expect } from 'vitest';
import {
  interpolatePath,
  buildQueryString,
  buildRequestUrl,
  mergeHeaders,
} from '@/api/client/request';

describe('interpolatePath', () => {
  it('should interpolate single param', () => {
    expect(interpolatePath('/accounts/{id}', { id: '123' })).toBe('/accounts/123');
  });

  it('should interpolate multiple params', () => {
    const result = interpolatePath('/accounts/{accountId}/transactions/{txnId}', {
      accountId: 'acc_001', txnId: 'txn_001',
    });
    expect(result).toBe('/accounts/acc_001/transactions/txn_001');
  });

  it('should return path unchanged with no params', () => {
    expect(interpolatePath('/accounts', undefined)).toBe('/accounts');
  });
});

describe('buildQueryString', () => {
  it('should build simple params', () => {
    const params = buildQueryString({ status: 'active', page: 1 });
    expect(params.get('status')).toBe('active');
    expect(params.get('page')).toBe('1');
  });

  it('should handle arrays', () => {
    const params = buildQueryString({ status: ['active', 'pending'] });
    expect(params.getAll('status')).toEqual(['active', 'pending']);
  });

  it('should omit undefined', () => {
    const params = buildQueryString({ status: 'active', type: undefined });
    expect(params.has('type')).toBe(false);
  });
});

describe('buildRequestUrl', () => {
  it('should combine base, path, params, and query', () => {
    const url = buildRequestUrl('https://api.example.com', '/accounts/{id}', { id: '123' }, { include: 'balance' });
    expect(url).toBe('https://api.example.com/accounts/123?include=balance');
  });

  it('should handle trailing slash', () => {
    const url = buildRequestUrl('https://api.example.com/', '/accounts');
    expect(url).toBe('https://api.example.com/accounts');
  });
});

describe('mergeHeaders', () => {
  it('should merge and override', () => {
    const result = mergeHeaders({ 'Content-Type': 'text/plain' }, { 'Content-Type': 'application/json' });
    expect(result['Content-Type']).toBe('application/json');
  });

  it('should skip undefined', () => {
    const result = mergeHeaders(undefined, { 'Accept': 'application/json' });
    expect(result['Accept']).toBe('application/json');
  });
});
