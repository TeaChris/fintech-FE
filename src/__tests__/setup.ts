/**
 * Global test setup.
 * - Registers jest-dom matchers
 * - Sets up MSW server
 */
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './mocks/server';

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Reset handlers between tests (no leakage)
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());
