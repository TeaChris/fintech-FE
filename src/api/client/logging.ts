/**
 * Structured logging with automatic sensitive data redaction.
 *
 * Design decisions:
 * - No `console.log` — uses injectable Logger interface
 * - Sensitive fields are redacted before logging
 * - All log entries are structured JSON (not string interpolation)
 * - Default logger is a noop (opt-in, not opt-out)
 * - Hook points for Sentry, DataDog, OpenTelemetry
 */

import type { LogEntry, LogLevel, Logger } from "@/api/types";

// ---------------------------------------------------------------------------
// Sensitive Field Redaction
// ---------------------------------------------------------------------------

/**
 * Fields whose values will be replaced with '[REDACTED]' in logs.
 * Case-insensitive matching against object keys.
 */
const SENSITIVE_FIELDS = new Set([
      "pin",
      "bvn",
      "cvv",
      "cvc",
      "ssn",
      "token",
      "secret",
      "cookie",
      "apikey",
      "api_key",
      "x-api-key",
      "password",
      "set-cookie",
      "cardnumber",
      "card_number",
      "access_token",
      "refresh_token",
      "authorization",
      "account_number",
      "routing_number",
      "social_security",
]);

const REDACTED = "[REDACTED]";

/**
 * Recursively redact sensitive fields from an object.
 * Returns a new object — does not mutate the input.
 */
export function redactSensitiveFields(
      obj: Record<string, unknown>,
      maxDepth: number = 5,
): Record<string, unknown> {
      if (maxDepth <= 0) {
            return { "[truncated]": "max depth reached" };
      }

      const result: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(obj)) {
            const lowerKey = key.toLowerCase();

            if (SENSITIVE_FIELDS.has(lowerKey)) {
                  result[key] = REDACTED;
                  continue;
            }

            if (
                  value !== null &&
                  typeof value === "object" &&
                  !Array.isArray(value)
            ) {
                  result[key] = redactSensitiveFields(
                        value as Record<string, unknown>,
                        maxDepth - 1,
                  );
            } else if (Array.isArray(value)) {
                  // Recurse into arrays to redact sensitive fields in nested objects
                  result[key] = value.map((item) =>
                        item !== null && typeof item === "object" && !Array.isArray(item)
                              ? redactSensitiveFields(
                                      item as Record<string, unknown>,
                                      maxDepth - 1,
                                )
                              : item,
                  );
            } else if (
                  typeof value === "string" &&
                  lowerKey.includes("token")
            ) {
                  // Catch fields like 'xsrf-token', 'id_token', etc.
                  result[key] = REDACTED;
            } else {
                  result[key] = value;
            }
      }

      return result;
}

/**
 * Redact sensitive values from a Headers object or plain header record.
 */
export function redactHeaders(
      headers: Record<string, string> | Headers,
): Record<string, string> {
      const plain: Record<string, string> = {};

      if (headers instanceof Headers) {
            headers.forEach((value, key) => {
                  const lowerKey = key.toLowerCase();
                  plain[key] = SENSITIVE_FIELDS.has(lowerKey) || lowerKey.includes('token') || lowerKey.includes('secret')
                        ? REDACTED
                        : value;
            });
      } else {
            for (const [key, value] of Object.entries(headers)) {
                  const lowerKey = key.toLowerCase();
                  plain[key] = SENSITIVE_FIELDS.has(lowerKey) || lowerKey.includes('token') || lowerKey.includes('secret')
                        ? REDACTED
                        : value;
            }
      }

      return plain;
}

// ---------------------------------------------------------------------------
// Noop Logger
// ---------------------------------------------------------------------------

/**
 * Default logger that does nothing.
 * Used when no logger is configured to avoid null checks.
 */
export const noopLogger: Logger = {
      debug: () => undefined,
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
};

// ---------------------------------------------------------------------------
// Structured Logger Implementation
// ---------------------------------------------------------------------------

/**
 * External handler for log entries.
 * Implement this to forward logs to Sentry, DataDog, etc.
 */
export type LogHandler = (entry: LogEntry) => void;

/**
 * Create a structured logger that redacts sensitive data
 * and forwards entries to one or more handlers.
 */
export function createLogger(options: {
      handlers: LogHandler[];
      minLevel?: LogLevel;
}): Logger {
      const { handlers, minLevel = "info" } = options;

      const levels: Record<LogLevel, number> = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3,
      };

      function shouldLog(level: LogLevel): boolean {
            return levels[level] >= levels[minLevel];
      }

      function emit(entry: LogEntry): void {
            if (!shouldLog(entry.level)) return;

            // Redact the entire entry before forwarding
            const redacted = redactSensitiveFields(
                  entry as unknown as Record<string, unknown>,
            ) as unknown as LogEntry;

            for (const handler of handlers) {
                  try {
                        handler(redacted);
                  } catch {
                        // Logging should never crash the application
                  }
            }
      }

      return {
            debug: (entry) => emit({ ...entry, level: "debug" }),
            info: (entry) => emit({ ...entry, level: "info" }),
            warn: (entry) => emit({ ...entry, level: "warn" }),
            error: (entry) => emit({ ...entry, level: "error" }),
      };
}

// ---------------------------------------------------------------------------
// Built-in Log Handlers
// ---------------------------------------------------------------------------

/**
 * Console log handler for development environments.
 * Uses structured console methods (not `console.log`).
 *
 * Should only be used in development — not production.
 */
export function createConsoleHandler(): LogHandler {
      return (entry: LogEntry) => {
            const { level, message, ...rest } = entry;

            switch (level) {
                  case "debug":
                        // eslint-disable-next-line no-console
                        console.debug(`[API:DEBUG] ${message}`, rest);
                        break;
                  case "info":
                        // eslint-disable-next-line no-console
                        console.info(`[API:INFO] ${message}`, rest);
                        break;
                  case "warn":
                        console.warn(`[API:WARN] ${message}`, rest);
                        break;
                  case "error":
                        console.error(`[API:ERROR] ${message}`, rest);
                        break;
            }
      };
}

/**
 * Create a handler that batches entries and flushes them
 * to an external service (e.g. DataDog, Sentry, OTLP).
 *
 * Returns the handler and a manual flush function.
 */
export function createBatchHandler(options: {
      flush: (entries: LogEntry[]) => Promise<void>;
      batchSize?: number;
      flushIntervalMs?: number;
}): { handler: LogHandler; flush: () => Promise<void> } {
      const { flush, batchSize = 50, flushIntervalMs = 5000 } = options;
      let buffer: LogEntry[] = [];
      let timer: ReturnType<typeof setTimeout> | null = null;

      async function flushBuffer(): Promise<void> {
            if (buffer.length === 0) return;

            const batch = buffer;
            buffer = [];

            try {
                  await flush(batch);
            } catch {
                  // If flush fails, silently discard — logging should never crash
            }
      }

      function scheduleFlush(): void {
            if (timer !== null) return;

            timer = setTimeout(() => {
                  timer = null;
                  void flushBuffer();
            }, flushIntervalMs);
      }

      return {
            handler: (entry: LogEntry) => {
                  buffer.push(entry);

                  if (buffer.length >= batchSize) {
                        void flushBuffer();
                  } else {
                        scheduleFlush();
                  }
            },
            flush: flushBuffer,
      };
}
