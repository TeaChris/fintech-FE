/**
 * Money-safe JSON serialization utilities.
 *
 * Design decisions:
 * - Monetary values are ALWAYS string (never number)
 * - Custom serializer prevents accidental float conversion
 * - Date values are serialized as ISO 8601 strings
 * - BigInt values are serialized as strings
 * - Custom reviver restores Date objects from ISO strings
 * - Edge-compatible (no Node.js-specific APIs)
 */

// ---------------------------------------------------------------------------
// Money-Safe Serialization
// ---------------------------------------------------------------------------

/**
 * Known money field names that should always remain as strings.
 * Used by the reviver to prevent accidental number parsing.
 */
const MONEY_FIELD_PATTERNS = new Set([
      'fee',
      'tax',
      'cost',
      'total',
      'limit',
      'price',
      'debit',
      'amount',
      'charge',
      'credit',
      'refund',
      'payment',
      'balance',
      'interest',
      'subtotal',
      'principal',
      'ledger_balance',
      'pending_balance',
      'available_balance',
])

/**
 * Check if a JSON key likely represents a monetary value.
 * Uses exact match and suffix matching (e.g. 'totalAmount').
 */
function isMoneyField(key: string): boolean {
      const lowerKey = key.toLowerCase()

      if (MONEY_FIELD_PATTERNS.has(lowerKey)) {
            return true
      }

      // Check suffixes like 'totalAmount', 'feeAmount'
      for (const pattern of MONEY_FIELD_PATTERNS) {
            if (lowerKey.endsWith(pattern)) {
                  return true
            }
      }

      return false
}

// ---------------------------------------------------------------------------
// JSON Replacer (Serialization)
// ---------------------------------------------------------------------------

/**
 * Custom JSON replacer that safely serializes:
 * - BigInt → string
 * - Date → ISO 8601 string
 * - undefined → omitted (JSON default)
 *
 * Does NOT convert money strings to numbers.
 */
export function safeReplacer(_key: string, value: unknown): unknown {
      if (typeof value === 'bigint') {
            return value.toString()
      }

      if (value instanceof Date) {
            return value.toISOString()
      }

      return value
}

/**
 * Money-safe JSON.stringify wrapper.
 * Ensures BigInt and Date values are properly serialized.
 */
export function safeStringify(value: unknown): string {
      return JSON.stringify(value, safeReplacer)
}

// ---------------------------------------------------------------------------
// JSON Reviver (Deserialization)
// ---------------------------------------------------------------------------

/** ISO 8601 date regex for reviver detection */
const ISO_DATE_REGEX =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/

/**
 * Custom JSON reviver that:
 * - Keeps money fields as strings (prevents float conversion)
 * - Converts ISO 8601 date strings to Date objects
 *
 * Note: Money fields that are already strings in the JSON
 * will remain strings. This reviver prevents accidental
 * conversion if a backend ever sends numbers.
 */
export function safeReviver(key: string, value: unknown): unknown {
      // If it's a number and the key is a money field, convert to string
      if (typeof value === 'number' && isMoneyField(key)) {
            return value.toString()
      }

      // Convert ISO date strings to Date objects
      if (typeof value === 'string' && ISO_DATE_REGEX.test(value)) {
            const date = new Date(value)
            if (!isNaN(date.getTime())) {
                  return date
            }
      }

      return value
}

/**
 * Pre-parse interceptor that converts numeric money field values to
 * quoted strings BEFORE JSON.parse processes them.
 *
 * This prevents IEEE 754 precision loss for large monetary values
 * by ensuring they are never parsed as JavaScript Numbers.
 *
 * Matches patterns like `"amount": 1234567890` and converts to
 * `"amount": "1234567890"`.
 */
function preserveMoneyFieldPrecision(jsonText: string): string {
      // Build a regex alternation from MONEY_FIELD_PATTERNS
      const fieldNames = Array.from(MONEY_FIELD_PATTERNS).join('|')
      // Match: "fieldName" : <number> (with optional whitespace)
      // Captures the field name and the numeric value
      const pattern = new RegExp(
            `("(?:${fieldNames})"\\s*:\\s*)(\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)`,
            'gi',
      )
      return jsonText.replace(pattern, '$1"$2"')
}

/**
 * Money-safe JSON.parse wrapper.
 * Prevents accidental float conversion of monetary values
 * and converts ISO date strings to Date objects.
 *
 * Uses a two-phase approach:
 * 1. Pre-parse: regex converts numeric money fields to strings in raw JSON
 * 2. Parse: standard reviver handles dates and remaining conversions
 */
export function safeParse(text: string): unknown {
      const sanitized = preserveMoneyFieldPrecision(text)
      return JSON.parse(sanitized, safeReviver)
}

// ---------------------------------------------------------------------------
// Body Serialization
// ---------------------------------------------------------------------------

/**
 * Determine the appropriate Content-Type and serialized body
 * for a request payload.
 *
 * Supports:
 * - Plain objects → JSON with money-safe serialization
 * - FormData → passed through (browser sets multipart boundary)
 * - Blob → passed through with detected content type
 * - ReadableStream → passed through for streaming uploads
 * - string → passed through as text/plain
 * - null/undefined → no body
 */
export function serializeBody(body: unknown): {
      serialized: BodyInit | null
      contentType: string | null
} {
      if (body === null || body === undefined) {
            return { serialized: null, contentType: null }
      }

      // FormData — let the browser set the correct multipart boundary
      if (body instanceof FormData) {
            return { serialized: body, contentType: null }
      }

      // Blob — use its type or default to octet-stream
      if (body instanceof Blob) {
            return {
                  serialized: body,
                  contentType: body.type || 'application/octet-stream',
            }
      }

      // ReadableStream — streaming upload
      if (
            typeof ReadableStream !== 'undefined' &&
            body instanceof ReadableStream
      ) {
            return {
                  serialized: body as unknown as BodyInit,
                  contentType: 'application/octet-stream',
            }
      }

      // String — pass through
      if (typeof body === 'string') {
            return { serialized: body, contentType: 'text/plain' }
      }

      // Object/Array — JSON serialize with money safety
      return {
            serialized: safeStringify(body),
            contentType: 'application/json',
      }
}
