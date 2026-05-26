/**
 * Composable middleware pipeline for the API client.
 *
 * Design decisions:
 * - Middleware functions receive a context and a `next` function
 * - Request middleware runs FIFO (first registered, first executed)
 * - Each middleware can modify context, short-circuit, or observe
 * - Built-in middleware: auth, tracing, logging, CSRF, idempotency
 * - User-extensible via the config.middleware array
 * - Middleware composition is pure — no shared mutable state
 */

import type {
      Middleware,
      RequestContext,
      ApiClientConfig,
      // HttpMethod,
} from "@/api/types";

import type { Logger } from "@/api/types";
import { redactHeaders } from "./logging";
import type { AuthCoordinator } from "./auth";
import { buildTracingHeaders } from "./tracing";
import { buildIdempotencyHeader, resolveIdempotencyKey } from "./idempotency";

// ---------------------------------------------------------------------------
// Middleware Composition
// ---------------------------------------------------------------------------

/**
 * Compose an array of middleware functions into a single pipeline.
 *
 * Execution order: middleware[0] → middleware[1] → ... → fetch
 *
 * Each middleware calls `next()` to pass control to the next middleware.
 * The last `next()` call executes the actual fetch.
 *
 * @param middlewares - Array of middleware functions
 * @param finalHandler - The actual fetch call (terminal handler)
 * @returns A single function that runs the entire pipeline
 */
export function composeMiddleware(
      middlewares: readonly Middleware[],
      finalHandler: (context: RequestContext) => Promise<Response>,
): (context: RequestContext) => Promise<Response> {
      // Build the chain from right to left
      let handler = finalHandler;

      for (let i = middlewares.length - 1; i >= 0; i--) {
            const middleware = middlewares[i];
            if (!middleware) continue;
            const nextHandler = handler;

            handler = (context: RequestContext) =>
                  middleware(context, () => nextHandler(context));
      }

      return handler;
}

// ---------------------------------------------------------------------------
// Built-in Middleware
// ---------------------------------------------------------------------------

/**
 * Tracing middleware — injects X-Request-ID and X-Correlation-ID headers.
 * Runs first to ensure all subsequent middleware have tracing context.
 */
export function createTracingMiddleware(clientVersion?: string): Middleware {
      return async (context, next) => {
            const tracingHeaders = buildTracingHeaders({
                  requestId: context.requestId,
                  correlationId: context.correlationId,
                  clientVersion,
            });

            // Merge tracing headers into context
            Object.assign(context.headers, tracingHeaders);

            return next();
      };
}

/**
 * Auth middleware — injects CSRF tokens and handles auth headers.
 * Skips auth for public paths and when skipAuth is set.
 */
export function createAuthMiddleware(
      authCoordinator: AuthCoordinator,
): Middleware {
      return async (context, next) => {
            const { config } = context;

            // Skip auth for public paths or explicit opt-out
            if (config.skipAuth || authCoordinator.isPublicPath(config.path)) {
                  return next();
            }

            // Build auth-related headers (CSRF token, etc.)
            const authHeaders = authCoordinator.buildAuthHeaders(config.method);
            Object.assign(context.headers, authHeaders);

            return next();
      };
}

/**
 * Idempotency middleware — generates and attaches idempotency keys
 * for state-changing requests (POST, PUT, PATCH).
 */
export function createIdempotencyMiddleware(): Middleware {
      return async (context, next) => {
            // Reuse pre-generated key from context if available (retry safety),
            // otherwise generate a new one.
            const existingKey = context.metadata['idempotencyKey'] as string | undefined;
            const key = existingKey ?? resolveIdempotencyKey(
                  context.config.method,
                  context.config.idempotencyKey,
            );

            if (key) {
                  const header = buildIdempotencyHeader(key);
                  Object.assign(context.headers, header);

                  // Store the key in metadata for retry reuse
                  context.metadata["idempotencyKey"] = key;
            }

            return next();
      };
}


/**
 * Default headers middleware — applies default headers from config.
 * Runs early so subsequent middleware can override.
 */
export function createDefaultHeadersMiddleware(
      defaultHeaders: Record<string, string>,
): Middleware {
      return async (context, next) => {
            // Default headers are applied first, allowing per-request overrides
            context.headers = { ...defaultHeaders, ...context.headers };
            return next();
      };
}

/**
 * Logging middleware — logs request start, completion, and errors.
 * Uses structured logging with automatic sensitive data redaction.
 */
export function createLoggingMiddleware(logger: Logger): Middleware {
      return async (context, next) => {
            const { requestId, correlationId, config } = context;

            // Log request start
            logger.info({
                  level: "info",
                  message: `API Request: ${config.method} ${config.path}`,
                  timestamp: new Date().toISOString(),
                  requestId,
                  correlationId,
                  method: config.method,
                  url: config.path,
            });

            try {
                  const response = await next();

                  // Log successful response
                  logger.info({
                        level: "info",
                        message: `API Response: ${response.status} ${config.method} ${config.path}`,
                        timestamp: new Date().toISOString(),
                        requestId,
                        correlationId,
                        method: config.method,
                        url: config.path,
                        status: response.status,
                        headers: redactHeaders(response.headers),
                  });

                  return response;
            } catch (error) {
                  // Log error
                  logger.error({
                        level: "error",
                        message: `API Error: ${config.method} ${config.path}`,
                        timestamp: new Date().toISOString(),
                        requestId,
                        correlationId,
                        method: config.method,
                        url: config.path,
                        error:
                              error instanceof Error
                                    ? error.message
                                    : "Unknown error",
                  });

                  throw error;
            }
      };
}

// ---------------------------------------------------------------------------
// Pipeline Builder
// ---------------------------------------------------------------------------

/**
 * Build the complete middleware pipeline from config.
 *
 * Order (innermost to outermost):
 * 1. Default headers (applied first, overridable)
 * 2. Tracing (injects request/correlation IDs)
 * 3. Auth (CSRF, auth headers)
 * 4. Idempotency (mutation keys)
 * 5. Logging (wraps everything for observability)
 * 6. User middleware (custom, runs after built-in)
 *
 * @param clientConfig - API client configuration
 * @param authCoordinator - Auth coordinator instance
 * @returns Ordered array of middleware
 */
export function buildMiddlewarePipeline(
      clientConfig: ApiClientConfig,
      authCoordinator: AuthCoordinator,
): Middleware[] {
      const pipeline: Middleware[] = [];

      // 1. Logging (outermost — wraps everything)
      if (clientConfig.logger) {
            pipeline.push(createLoggingMiddleware(clientConfig.logger));
      }

      // 2. Default headers
      if (clientConfig.defaultHeaders) {
            pipeline.push(
                  createDefaultHeadersMiddleware(clientConfig.defaultHeaders),
            );
      }

      // 3. Tracing
      pipeline.push(createTracingMiddleware());

      // 4. Auth
      pipeline.push(createAuthMiddleware(authCoordinator));

      // 5. Idempotency
      pipeline.push(createIdempotencyMiddleware());

      // 6. User-provided middleware
      if (clientConfig.middleware) {
            pipeline.push(...clientConfig.middleware);
      }

      return pipeline;
}
