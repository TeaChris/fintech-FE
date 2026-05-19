/**
 * Response parser — Content-Type–based response handling.
 *
 * Design decisions:
 * - Auto-detects response type from Content-Type header
 * - JSON responses go through money-safe parsing + Zod validation
 * - Blob responses for file downloads
 * - ReadableStream for streaming/SSE
 * - Text responses for plain text
 * - Empty responses (204 No Content)
 * - Consistent error handling across all response types
 */

import type { ZodType } from "zod";
import { safeParse } from "./serialization";
import { parseResponse } from "./validation";
import { extractServerRequestId } from "./tracing";
import type { ApiResponse, ResponseMeta, ResponseType } from "@/api/types";

// ---------------------------------------------------------------------------
// Response Type Detection
// ---------------------------------------------------------------------------

/**
 * Detect the response type from the Content-Type header.
 *
 * @param response - The fetch Response
 * @param requestedType - Explicitly requested response type
 * @returns The detected response type
 */
export function detectResponseType(
      response: Response,
      requestedType?: ResponseType,
): ResponseType {
      // If explicitly requested, use that
      if (requestedType) return requestedType;

      // 204 No Content
      if (response.status === 204) return "empty";

      const contentType = response.headers.get("content-type") ?? "";

      if (contentType.includes("application/json")) return "json";
      if (contentType.includes("text/event-stream")) return "stream";
      if (contentType.includes("application/octet-stream")) return "blob";
      if (contentType.includes("application/pdf")) return "blob";
      if (contentType.includes("image/")) return "blob";
      if (contentType.includes("video/")) return "blob";
      if (contentType.includes("audio/")) return "blob";
      if (contentType.startsWith("text/")) return "text";

      // Default to JSON for unknown types
      return "json";
}

// ---------------------------------------------------------------------------
// Response Parsing
// ---------------------------------------------------------------------------

/**
 * Parse a JSON response body with money-safe deserialization.
 *
 * Uses our custom reviver that prevents float conversion of money fields
 * and converts ISO date strings to Date objects.
 *
 * @param response - The fetch Response
 * @returns Parsed JSON data
 */
async function parseJsonResponse(response: Response): Promise<unknown> {
      const text = await response.text();

      if (!text || text.trim().length === 0) {
            return null;
      }

      return safeParse(text);
}

/**
 * Parse and validate a response body based on its type.
 *
 * This is the main response processing function.
 * It handles all response types and applies Zod validation for JSON.
 *
 * @param response - The fetch Response
 * @param responseType - Detected or requested response type
 * @param schema - Optional Zod schema for JSON validation
 * @param meta - Response metadata for error context
 * @returns Parsed (and optionally validated) response data
 */
export async function parseResponseBody<T>(
      response: Response,
      responseType: ResponseType,
      schema?: ZodType<T>,
      meta?: {
            requestId?: string;
            correlationId?: string;
            url?: string;
            method?: string;
      },
): Promise<T> {
      switch (responseType) {
            case "empty":
                  return null as T;

            case "json": {
                  const data = await parseJsonResponse(response);

                  // If a schema is provided, validate the response
                  if (schema) {
                        return parseResponse(schema, data, {
                              requestId: meta?.requestId,
                              correlationId: meta?.correlationId,
                              url: meta?.url,
                              method: meta?.method,
                        });
                  }

                  // No schema — return raw parsed data (caller accepts the risk)
                  return data as T;
            }

            case "blob": {
                  const blob = await response.blob();
                  return blob as T;
            }

            case "stream": {
                  if (!response.body) {
                        throw new Error(
                              "Response body is null — streaming not available",
                        );
                  }
                  return response.body as T;
            }

            case "text": {
                  const text = await response.text();
                  return text as T;
            }

            default: {
                  // Exhaustive check — should never reach here
                  const _exhaustive: never = responseType;
                  throw new Error(`Unsupported response type: ${_exhaustive}`);
            }
      }
}

// ---------------------------------------------------------------------------
// Response Metadata
// ---------------------------------------------------------------------------

/**
 * Build response metadata from the response and request context.
 *
 * @param response - The fetch Response
 * @param context - Request context with timing and ID info
 * @returns ResponseMeta object
 */
export function buildResponseMeta(
      response: Response,
      context: {
            requestId: string;
            correlationId: string;
            startTime: number;
            attempt: number;
            url: string;
            method: string;
            durationMs: number;
      },
): ResponseMeta {
      return {
            requestId: extractServerRequestId(
                  response.headers,
                  context.requestId,
            ),
            correlationId: context.correlationId,
            durationMs: context.durationMs,
            retryCount: context.attempt,
            timestamp: new Date().toISOString(),
            url: context.url,
            method: context.method as ResponseMeta["method"],
      };
}

// ---------------------------------------------------------------------------
// Full Response Builder
// ---------------------------------------------------------------------------

/**
 * Build a complete ApiResponse from a raw fetch Response.
 *
 * This is the final step in the response pipeline:
 * 1. Detect response type
 * 2. Parse body (with money-safe JSON)
 * 3. Validate with Zod (if schema provided)
 * 4. Build metadata
 * 5. Return normalized ApiResponse
 *
 * @param response - The fetch Response
 * @param schema - Optional Zod schema for validation
 * @param requestedType - Explicitly requested response type
 * @param context - Request context for metadata
 * @returns Normalized ApiResponse
 */
export async function buildApiResponse<T>(
      response: Response,
      schema: ZodType<T> | undefined,
      requestedType: ResponseType | undefined,
      context: {
            requestId: string;
            correlationId: string;
            startTime: number;
            attempt: number;
            url: string;
            method: string;
            durationMs: number;
      },
): Promise<ApiResponse<T>> {
      const responseType = detectResponseType(response, requestedType);

      const data = await parseResponseBody<T>(response, responseType, schema, {
            requestId: context.requestId,
            correlationId: context.correlationId,
            url: context.url,
            method: context.method,
      });

      const meta = buildResponseMeta(response, context);

      return {
            data,
            status: response.status,
            headers: response.headers,
            meta,
      };
}
