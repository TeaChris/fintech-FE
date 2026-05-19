/**
 * Tests for serialization — money safety critical.
 *
 * Covers:
 * - safeStringify never loses precision on large numbers
 * - safeParse preserves money strings (no float conversion)
 * - Date string auto-parsing
 * - BigInt handling
 * - serializeBody for different types
 */
import { describe, it, expect } from 'vitest';
import {
  safeStringify,
  safeParse,
  serializeBody,
} from '@/api/client/serialization';

describe('safeStringify', () => {
  it('should stringify plain objects', () => {
    const result = safeStringify({ name: 'test', value: 42 });
    expect(result).toBe('{"name":"test","value":42}');
  });

  it('should handle BigInt by converting to string', () => {
    const result = safeStringify({ bigValue: BigInt('9007199254740993') });
    expect(result).toContain('"9007199254740993"');
  });

  it('should handle Date objects', () => {
    const date = new Date('2024-01-15T10:00:00Z');
    const result = safeStringify({ createdAt: date });
    expect(result).toContain('2024-01-15');
  });

  it('should handle null and undefined', () => {
    expect(safeStringify(null)).toBe('null');
    expect(safeStringify(undefined)).toBe(undefined);
  });

  it('should handle nested objects', () => {
    const obj = {
      account: {
        balance: { amount: '150000.50', currency: 'NGN' },
      },
    };
    const result = safeStringify(obj);
    const parsed = JSON.parse(result!);
    expect(parsed.account.balance.amount).toBe('150000.50');
  });
});

describe('safeParse', () => {
  it('should parse standard JSON', () => {
    const result = safeParse('{"name":"test","value":42}');
    expect(result).toEqual({ name: 'test', value: 42 });
  });

  it('should convert ISO date strings to Date objects', () => {
    const result = safeParse('{"createdAt":"2024-01-15T10:00:00.000Z"}') as Record<string, unknown>;
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('should NOT convert money-like strings to numbers', () => {
    // This is the critical money-safety test
    const json = '{"amount":"150000.50","currency":"NGN"}';
    const result = safeParse(json) as Record<string, unknown>;
    expect(typeof result.amount).toBe('string');
    expect(result.amount).toBe('150000.50');
  });

  it('should preserve string values that look like numbers but are not amounts', () => {
    const json = '{"code":"12345","ref":"ABC-001"}';
    const result = safeParse(json) as Record<string, unknown>;
    expect(result.code).toBe('12345');
    expect(result.ref).toBe('ABC-001');
  });
});

describe('serializeBody', () => {
  it('should serialize objects to JSON', () => {
    const { serialized, contentType } = serializeBody({ name: 'test' });
    expect(typeof serialized).toBe('string');
    expect(contentType).toBe('application/json');
  });

  it('should pass through FormData without content-type', () => {
    const formData = new FormData();
    formData.append('file', new Blob(['test']), 'test.txt');
    const { serialized, contentType } = serializeBody(formData);
    expect(serialized).toBe(formData);
    expect(contentType).toBeNull(); // Browser sets multipart boundary
  });

  it('should pass through strings as-is', () => {
    const { serialized, contentType } = serializeBody('raw body');
    expect(serialized).toBe('raw body');
    expect(contentType).toBe('text/plain');
  });

  it('should return null for undefined body', () => {
    const { serialized, contentType } = serializeBody(undefined);
    expect(serialized).toBeNull();
    expect(contentType).toBeNull();
  });
});
