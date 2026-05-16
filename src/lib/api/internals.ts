// internals.ts — Shared utilities: logger, serializer, retry, auth, queue
import type {
  LogLevel, QueryParamStyle, RetryConfig, AuthConfig, BackoffStrategy,
  RequestConfig, ApiResponse, InterceptorRequestConfig,
  RequestInterceptor, ResponseInterceptor,
} from './types'
import { ApiError, flattenHeaders } from './types'

// ── Requirement 15: Logging with redaction ───────────────────────────────────

const REDACTED = new Set([
  'authorization','x-csrf-token','x-api-key','cookie','set-cookie',
  'password','token','secret','access_token','refresh_token',
])
const LEVEL_RANK: Record<LogLevel, number> = { debug:0, info:1, warn:2, error:3, silent:99 }

function redact(val: unknown, d = 0): unknown {
  if (d > 5 || val == null || typeof val !== 'object') return val
  if (Array.isArray(val)) return val.map(v => redact(v, d + 1))
  const o: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(val as Record<string, unknown>))
    o[k] = REDACTED.has(k.toLowerCase()) ? '[REDACTED]' : redact(v, d + 1)
  return o
}

export class Logger {
  private level: LogLevel
  constructor(level: LogLevel = 'silent') { this.level = level }
  setLevel(l: LogLevel) { this.level = l }
  getLevel() { return this.level }
  private ok(l: LogLevel) { return LEVEL_RANK[l] >= LEVEL_RANK[this.level] }
  private t(l: string) { return `[API:${l.toUpperCase()}] ${new Date().toISOString()}` }
  debug(m: string, ...a: unknown[]) { if (this.ok('debug')) console.debug(this.t('debug'), m, ...a.map(v=>redact(v))) }
  info(m: string, ...a: unknown[]) { if (this.ok('info')) console.info(this.t('info'), m, ...a.map(v=>redact(v))) }
  warn(m: string, ...a: unknown[]) { if (this.ok('warn')) console.warn(this.t('warn'), m, ...a.map(v=>redact(v))) }
  error(m: string, ...a: unknown[]) { if (this.ok('error')) console.error(this.t('error'), m, ...a.map(v=>redact(v))) }
}

// ── Requirement 1: Query param serialisation ─────────────────────────────────

export function serializeParams(params: Record<string, unknown>, style: QueryParamStyle): string {
  const parts: string[] = []
  function enc(key: string, value: unknown): void {
    if (value == null) return
    if (Array.isArray(value)) {
      if (style === 'comma') parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value.join(','))}`)
      else if (style === 'bracket') value.forEach(v => parts.push(`${encodeURIComponent(key+'[]')}=${encodeURIComponent(String(v))}`))
      else value.forEach(v => parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`))
    } else if (typeof value === 'object') {
      for (const [k, v] of Object.entries(value as Record<string, unknown>))
        enc(style === 'bracket' ? `${key}[${k}]` : `${key}.${k}`, v)
    } else parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
  }
  for (const [k, v] of Object.entries(params)) enc(k, v)
  return parts.join('&')
}

// ── Requirement 8: Retry with exponential backoff + jitter ───────────────────

export const DEFAULT_RETRY: RetryConfig = {
  count: 3, delay: 1000, backoff: 'exponential', jitter: true,
  retryOn: [408, 429, 500, 502, 503, 504], idempotentOnly: true, respectRetryAfter: true,
}

const IDEMPOTENT = new Set(['GET','PUT','DELETE','HEAD','OPTIONS'])

function getDelay(attempt: number, cfg: RetryConfig): number {
  let ms = cfg.backoff === 'exponential' ? cfg.delay * 2 ** (attempt - 1)
    : cfg.backoff === 'linear' ? cfg.delay * attempt : cfg.delay
  if (cfg.jitter) ms += Math.random() * ms * 0.3
  return Math.min(ms, 30_000)
}

export async function shouldRetry(
  error: ApiError, config: RequestConfig, method: string, retryCfg: RetryConfig
): Promise<boolean> {
  if (config.skipRetry || config._retryCount! > retryCfg.count) return false
  if (error.isCancelled) return false
  if (retryCfg.idempotentOnly && !IDEMPOTENT.has(method.toUpperCase())) return false
  if (error.isNetworkError || error.isTimeoutError) return true
  if (error.status != null && retryCfg.retryOn.includes(error.status)) return true
  return false
}

export async function waitForRetry(config: RequestConfig, retryCfg: RetryConfig, retryAfterHeader?: string | null): Promise<void> {
  const attempt = config._retryCount ?? 1
  let delay = getDelay(attempt, retryCfg)
  if (retryCfg.respectRetryAfter && retryAfterHeader) {
    const s = parseInt(retryAfterHeader, 10)
    if (!isNaN(s)) delay = s * 1000
  }
  await new Promise(r => setTimeout(r, delay))
}

// ── Requirement 5: Auth token store + refresh queue ──────────────────────────

const AUTH_DEFAULTS: AuthConfig = {
  tokenKey: 'app_access_token', refreshTokenKey: 'app_refresh_token',
  refreshEndpoint: '/auth/refresh', headerName: 'Authorization', scheme: 'Bearer',
}

export class TokenStore {
  private cfg: AuthConfig
  constructor(overrides: Partial<AuthConfig> = {}) { this.cfg = { ...AUTH_DEFAULTS, ...overrides } }
  getAccessToken(): string | null { return typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(this.cfg.tokenKey) : null }
  setAccessToken(t: string) { if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(this.cfg.tokenKey, t) }
  getRefreshToken(): string | null { return typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(this.cfg.refreshTokenKey) : null }
  setRefreshToken(t: string) { if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(this.cfg.refreshTokenKey, t) }
  clearTokens() { if (typeof sessionStorage !== 'undefined') { sessionStorage.removeItem(this.cfg.tokenKey); sessionStorage.removeItem(this.cfg.refreshTokenKey) } }
  getAuthHeader(): Record<string, string> {
    const t = this.getAccessToken()
    return t ? { [this.cfg.headerName]: `${this.cfg.scheme} ${t}` } : {}
  }
  getConfig(): Readonly<AuthConfig> { return this.cfg }
}

type QueueEntry = { resolve: (t: string) => void; reject: (e: unknown) => void }

export class RefreshQueue {
  private running = false
  private queue: QueueEntry[] = []
  get isRunning() { return this.running }

  async run(refreshFn: () => Promise<string>): Promise<string> {
    if (this.running) return new Promise<string>((resolve, reject) => { this.queue.push({ resolve, reject }) })
    this.running = true
    try {
      const token = await refreshFn()
      this.queue.forEach(e => e.resolve(token))
      return token
    } catch (err) {
      this.queue.forEach(e => e.reject(err))
      throw err
    } finally { this.queue = []; this.running = false }
  }
}

export function dispatchLogout(reason = 'session_expired') {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('api:logout', { detail: { reason } }))
}

// ── Requirement 10: Offline queue ────────────────────────────────────────────

interface QueuedRequest {
  execute: () => Promise<unknown>
  resolve: (v: unknown) => void
  reject: (e: unknown) => void
}

export class OfflineQueue {
  private queue: QueuedRequest[] = []
  private enabled: boolean
  constructor(enabled = false) {
    this.enabled = enabled
    if (typeof window !== 'undefined') window.addEventListener('online', () => this.drain())
  }
  get isOffline() { return typeof navigator !== 'undefined' ? !navigator.onLine : false }
  enqueue<T>(executeFn: () => Promise<T>): Promise<T> {
    if (!this.enabled) return executeFn()
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ execute: executeFn, resolve: resolve as (v: unknown) => void, reject })
    })
  }
  private async drain() {
    const items = [...this.queue]; this.queue = []
    for (const item of items) {
      try { item.resolve(await item.execute()) }
      catch (e) { item.reject(e) }
    }
  }
}

// ── Requirement 10: Request deduplication store ──────────────────────────────

export class DeduplicationStore {
  private pending = new Map<string, Promise<ApiResponse<unknown>>>()
  buildKey(method: string, url: string, params?: Record<string, unknown>): string {
    return `${method}|${url}|${params ? JSON.stringify(params) : ''}`
  }
  get<T>(key: string): Promise<ApiResponse<T>> | null {
    return (this.pending.get(key) as Promise<ApiResponse<T>>) ?? null
  }
  set(key: string, promise: Promise<ApiResponse<unknown>>) {
    this.pending.set(key, promise)
    promise.finally(() => this.pending.delete(key))
  }
}

// ── Requirement 14: Environment-aware config resolution ──────────────────────

export const DEFAULT_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
}

export function resolveEnvConfig(cfg?: { baseURL?: string; timeout?: number; environment?: string }): { baseURL: string; timeout: number } {
  const env = cfg?.environment ?? (typeof process !== 'undefined' ? process.env.NODE_ENV : 'development')
  const timeouts: Record<string, number> = { development: 30_000, staging: 20_000, production: 15_000 }
  return {
    baseURL: cfg?.baseURL ?? (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_BASE_URL ?? '' : ''),
    timeout: cfg?.timeout ?? (timeouts[env ?? 'development'] ?? 15_000),
  }
}

// ── Requirement 4: Interceptor runner ────────────────────────────────────────

export class InterceptorManager {
  private request: RequestInterceptor[] = []
  private response: ResponseInterceptor[] = []

  addRequest(i: RequestInterceptor): () => void {
    this.request.push(i)
    return () => { this.request = this.request.filter(x => x !== i) }
  }
  addResponse(i: ResponseInterceptor): () => void {
    this.response.push(i)
    return () => { this.response = this.response.filter(x => x !== i) }
  }

  /** Run request interceptors in LIFO order (Requirement 4) */
  async runRequest(config: InterceptorRequestConfig): Promise<InterceptorRequestConfig> {
    const reversed = [...this.request].reverse()
    let c = config
    for (const interceptor of reversed) {
      try { c = await interceptor.onFulfilled(c) }
      catch (err) { if (interceptor.onRejected) interceptor.onRejected(err); else throw err }
    }
    return c
  }

  /** Run response interceptors in FIFO order (Requirement 4) */
  async runResponse(response: ApiResponse<unknown>): Promise<ApiResponse<unknown>> {
    let r = response
    for (const interceptor of this.response) {
      try { r = await interceptor.onFulfilled(r) }
      catch (err) { if (interceptor.onRejected) interceptor.onRejected(err); else throw err }
    }
    return r
  }
}
