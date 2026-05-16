// ─────────────────────────────────────────────────────────────────────────────
// instance.ts — Example instantiation with interceptors, auth, and logging
// ─────────────────────────────────────────────────────────────────────────────

import { ApiClient } from './ApiClient'
import type { ApiResponse } from './types'
import { ApiError } from './types'

// ─── Requirement 14: Environment-aware configuration ─────────────────────────
// Base URL and timeout are resolved automatically from environment variables:
//   NEXT_PUBLIC_API_BASE_URL — fallback base URL
//   NODE_ENV                 — drives timeout defaults

const api = ApiClient.create({
  // Requirement 14: Environment/Config — override per-environment as needed
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.example.com',
  timeout: 15_000,

  // Requirement 1: Default headers (JSON, Accept)
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },

  // Requirement 1: withCredentials for cookie-based sessions
  withCredentials: true,

  // Requirement 15: Verbose dev-logging (auto-redacts Authorization, tokens, etc.)
  logLevel: process.env.NODE_ENV === 'production' ? 'error' : 'debug',

  // Requirement 1: Default query param serialisation style
  queryStyle: 'bracket',

  // Requirement 8: Retry & Backoff — exponential with jitter on transient errors
  retry: {
    count: 3,
    delay: 1_000,
    backoff: 'exponential',
    jitter: true,
    retryOn: [408, 429, 500, 502, 503, 504],
    idempotentOnly: true,
    respectRetryAfter: true,
  },

  // Requirement 5: Auth & Session configuration
  auth: {
    tokenKey: 'app_access_token',
    refreshTokenKey: 'app_refresh_token',
    refreshEndpoint: '/api/v1/auth/refresh',
    headerName: 'Authorization',
    scheme: 'Bearer',
    // Custom extractor if your refresh response has a different shape:
    // extractToken: (data) => (data as { token: string }).token,
  },

  // Requirement 10: Enable offline request queueing
  queue: {
    enableOfflineQueue: true,
  },

  // Requirement 16: CSRF token (read from a meta tag or cookie)
  csrfToken: typeof document !== 'undefined'
    ? document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? undefined
    : undefined,
  csrfHeaderName: 'X-CSRF-Token',
})

// ─── Requirement 4: Request Interceptor — logging & config mutation (LIFO) ───

api.addRequestInterceptor({
  onFulfilled: (config) => {
    // Example: attach a correlation ID to every request for tracing
    config.headers = {
      ...(config.headers ?? {}),
      'X-Request-ID': crypto.randomUUID(),
    }
    return config
  },
  onRejected: (error) => {
    console.error('[RequestInterceptor] setup failed:', error)
    throw error
  },
})

// ─── Requirement 4: Response Interceptor — parsing & global error handling (FIFO)

api.addResponseInterceptor({
  onFulfilled: (response) => {
    // Example: unwrap a common { success, data, message } envelope
    const body = response.data as Record<string, unknown> | null
    if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
      return { ...response, data: body.data }
    }
    return response
  },
  onRejected: (error) => {
    // Requirement 7: Global error handling — toast, Sentry, etc.
    if (ApiError.isApiError(error)) {
      if (error.status === 403) {
        console.warn('[API] Forbidden — you may not have permission for this resource.')
      }
      if (error.status === 404) {
        console.warn('[API] Resource not found.')
      }
      if (error.isNetworkError) {
        console.warn('[API] Network error — check your connection.')
      }
    }
    throw error
  },
})

// ─── Requirement 5: Listen for logout events (session expiry) ────────────────

if (typeof window !== 'undefined') {
  window.addEventListener('api:logout', ((event: CustomEvent<{ reason: string }>) => {
    console.warn(`[API] Session ended: ${event.detail.reason}`)
    // Navigate to login page — framework-specific:
    // router.push('/login')
    // window.location.href = '/login'
  }) as EventListener)
}

// ─── Export ──────────────────────────────────────────────────────────────────

export { api }
export { ApiClient } from './ApiClient'
export { ApiError } from './types'
export type {
  ApiClientConfig,
  RequestConfig,
  ApiResponse,
  ApiErrorShape,
  ApiErrorCode,
  HttpMethod,
  LogLevel,
  QueryParamStyle,
  BodyType,
  ResponseType,
  RetryConfig,
  AuthConfig,
  UploadConfig,
  DownloadConfig,
  RequestInterceptor,
  ResponseInterceptor,
} from './types'

// ─── Usage examples ──────────────────────────────────────────────────────────
//
// import { api } from '@/lib/api/instance'
//
// // Requirement 3: Type-safe GET
// interface User { id: string; name: string; email: string }
// const { data: users } = await api.get<User[]>('/users')
//
// // Requirement 3: Type-safe POST with body inference
// interface CreateUserDto { name: string; email: string }
// const { data: newUser } = await api.post<User, CreateUserDto>('/users', {
//   name: 'Jane', email: 'jane@example.com',
// })
//
// // Requirement 9: Cancellation
// const ctrl = api.createAbortController()
// const { data } = await api.get('/search', { signal: ctrl.signal, params: { q: 'test' } })
// // ctrl.abort()  — cancels the request
//
// // Requirement 5: Auth
// api.setAuthToken('access_jwt', 'refresh_jwt')
// api.clearAuthToken()
//
// // Requirement 11: Upload with progress
// const form = new FormData()
// form.append('file', someFile)
// await api.upload('/files', form, {
//   onProgress: (pct, loaded, total) => console.log(`${pct}% (${loaded}/${total})`),
// })
//
// // Requirement 11: Download with progress
// await api.download('/reports/annual.pdf', {
//   filename: 'annual-report.pdf',
//   onProgress: (loaded, total) => console.log(`Downloaded ${loaded} of ${total ?? '?'} bytes`),
// })
//
// // Requirement 1: Method-specific config overrides
// await api.get('/slow-endpoint', { timeout: 60_000, skipRetry: true })
//
// // Requirement 12: Non-JSON response parsing
// const { data: html } = await api.get<string>('/page', { responseType: 'text' })
// const { data: blob } = await api.get<Blob>('/image.png', { responseType: 'blob' })
