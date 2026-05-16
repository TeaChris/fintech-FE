// ─────────────────────────────────────────────────────────────────────────────
// ApiClient.ts — Zero-dependency, class-based API client built on native fetch
// ─────────────────────────────────────────────────────────────────────────────

import type {
  HttpMethod, ApiClientConfig, RequestConfig, ApiResponse,
  RetryConfig, InterceptorRequestConfig, RequestInterceptor,
  ResponseInterceptor, UploadConfig, DownloadConfig, ResponseType,
} from './types'
import { ApiError, flattenHeaders } from './types'
import {
  Logger, TokenStore, RefreshQueue, OfflineQueue, DeduplicationStore,
  InterceptorManager, serializeParams, resolveEnvConfig,
  DEFAULT_HEADERS, DEFAULT_RETRY, shouldRetry, waitForRetry, dispatchLogout,
} from './internals'

// ── Requirement 1: Body serialisation based on BodyType ──────────────────────

function serializeBody(body: unknown, config: RequestConfig): { body: BodyInit | null; contentType?: string } {
  if (body == null) return { body: null }
  if (body instanceof FormData) return { body } // Requirement 11: FormData — browser sets boundary
  if (body instanceof Blob) return { body, contentType: 'application/octet-stream' }
  if (body instanceof ArrayBuffer) return { body, contentType: 'application/octet-stream' }
  if (typeof body === 'string') return { body, contentType: 'text/plain' }

  const t = config.bodyType
  if (t === 'text') return { body: String(body), contentType: 'text/plain' }
  if (t === 'blob' && body instanceof Blob) return { body }
  if (t === 'url-encoded') {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries(body as Record<string, string>)) p.set(k, v)
    return { body: p, contentType: 'application/x-www-form-urlencoded' }
  }
  // Default: JSON
  return { body: JSON.stringify(body), contentType: 'application/json' }
}

// ── Requirement 12: Response parsing ─────────────────────────────────────────

async function parseResponse<T>(response: Response, type: ResponseType = 'json'): Promise<T> {
  switch (type) {
    case 'text': return await response.text() as T
    case 'blob': return await response.blob() as T
    case 'arrayBuffer': return await response.arrayBuffer() as T
    case 'stream': return response.body as T
    case 'json': default: {
      const text = await response.text()
      if (!text) return null as T
      try { return JSON.parse(text) as T }
      catch { return text as T }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ApiClient class
// ─────────────────────────────────────────────────────────────────────────────

export class ApiClient {
  private readonly log: Logger
  private readonly tokenStore: TokenStore
  private readonly refreshQueue: RefreshQueue
  private readonly offlineQueue: OfflineQueue
  private readonly dedup: DeduplicationStore
  private readonly interceptors: InterceptorManager
  private readonly retryCfg: RetryConfig
  private baseURL: string
  private readonly timeout: number
  private readonly defaultHeaders: Record<string, string>
  private readonly withCredentials: boolean
  private readonly queryStyle: string
  private readonly csrfToken?: string
  private readonly csrfHeaderName: string

  constructor(config: ApiClientConfig = {}) {
    const { baseURL, timeout } = resolveEnvConfig(config)
    this.baseURL = baseURL
    this.timeout = timeout
    this.withCredentials = config.withCredentials ?? false
    this.queryStyle = config.queryStyle ?? 'repeat'
    this.csrfToken = config.csrfToken
    this.csrfHeaderName = config.csrfHeaderName ?? 'X-CSRF-Token'
    this.defaultHeaders = { ...DEFAULT_HEADERS, ...(config.defaultHeaders ?? {}) }

    // Subsystems
    this.log = new Logger(config.logLevel ?? 'silent')
    this.tokenStore = new TokenStore(config.auth ?? {})
    this.refreshQueue = new RefreshQueue()
    this.offlineQueue = new OfflineQueue(config.queue?.enableOfflineQueue ?? false)
    this.dedup = new DeduplicationStore()
    this.interceptors = new InterceptorManager()
    this.retryCfg = { ...DEFAULT_RETRY, ...(config.retry ?? {}) }
  }

  // ─── Core request pipeline ────────────────────────────────────────────────

  private async request<T>(
    method: HttpMethod, url: string, data?: unknown, config: RequestConfig = {},
  ): Promise<ApiResponse<T>> {
    const MUTATING = new Set<HttpMethod>(['POST', 'PUT', 'PATCH', 'DELETE'])

    // Requirement 10: Offline queue — buffer mutating requests when offline
    if (MUTATING.has(method) && this.offlineQueue.isOffline) {
      return this.offlineQueue.enqueue(() => this._pipeline<T>(method, url, data, config)) as Promise<ApiResponse<T>>
    }

    // Requirement 10: GET deduplication — share in-flight Promise
    if (method === 'GET') {
      const key = this.dedup.buildKey(method, url, config.params)
      const pending = this.dedup.get<T>(key)
      if (pending) {
        this.log.debug(`[DEDUP] sharing in-flight ${url}`)
        return pending
      }
      const promise = this._pipeline<T>(method, url, data, config)
      this.dedup.set(key, promise as Promise<ApiResponse<unknown>>)
      return promise
    }

    return this._pipeline<T>(method, url, data, config)
  }

  private async _pipeline<T>(
    method: HttpMethod, url: string, data?: unknown, config: RequestConfig = {},
  ): Promise<ApiResponse<T>> {
    // Build interceptor config
    let iConfig: InterceptorRequestConfig = {
      ...config,
      url,
      method,
      body: data,
      _startTime: Date.now(),
    }

    // Requirement 4: Run request interceptors (LIFO)
    iConfig = await this.interceptors.runRequest(iConfig)

    // Resolve URL
    const base = iConfig.baseURL ?? this.baseURL
    let fullUrl = iConfig.url.startsWith('http') ? iConfig.url : `${base}${iConfig.url}`

    // Requirement 1: Serialise query params
    if (iConfig.params && Object.keys(iConfig.params).length) {
      const qs = serializeParams(iConfig.params, (iConfig.queryStyle ?? this.queryStyle) as 'flat'|'bracket'|'comma'|'repeat')
      const sep = fullUrl.includes('?') ? '&' : '?'
      fullUrl = `${fullUrl}${sep}${qs}`
    }

    // Build headers
    const headers: Record<string, string> = { ...this.defaultHeaders, ...(iConfig.headers ?? {}) }

    // Requirement 5: Auto-attach auth token (Bearer/JWT)
    if (!iConfig.skipAuth) {
      const authH = this.tokenStore.getAuthHeader()
      Object.assign(headers, authH)
    }

    // Requirement 16: CSRF token attachment
    const csrf = iConfig.csrfToken ?? this.csrfToken
    if (csrf) headers[iConfig.csrfHeaderName ?? this.csrfHeaderName] = csrf

    // Serialise body (Requirement 1: varied body support)
    const serialized = serializeBody(iConfig.body, iConfig)
    if (serialized.contentType) headers['Content-Type'] = serialized.contentType
    // FormData — let browser set Content-Type with boundary
    if (iConfig.body instanceof FormData) delete headers['Content-Type']

    // Requirement 9: AbortController for timeout + user cancellation
    const controller = new AbortController()
    const timeoutMs = iConfig.timeout ?? this.timeout
    const timer = setTimeout(() => controller.abort('timeout'), timeoutMs)

    // Chain user-provided signal
    if (iConfig.signal) {
      iConfig.signal.addEventListener('abort', () => controller.abort(iConfig.signal!.reason ?? 'cancelled'))
    }

    this.log.debug(`→ ${method} ${fullUrl}`, { headers })

    try {
      const response = await fetch(fullUrl, {
        method,
        headers,
        body: serialized.body,
        credentials: (iConfig.withCredentials ?? this.withCredentials) ? 'include' : 'same-origin',
        signal: controller.signal,
      })

      clearTimeout(timer)
      const elapsed = Date.now() - (iConfig._startTime ?? Date.now())

      // Requirement 7: HTTP errors (4xx/5xx)
      if (!response.ok) {
        let errorBody: unknown = null
        try { errorBody = await response.json() } catch { errorBody = await response.text().catch(() => null) }

        this.log.error(`← ${response.status} ${fullUrl} [${elapsed}ms]`, { data: errorBody })

        const apiError = ApiError.fromResponse(response, errorBody)

        // Requirement 5: 401 → attempt token refresh, queue requests, replay
        if (response.status === 401 && !iConfig._isRefreshRequest && !iConfig.skipAuth) {
          try {
            const newToken = await this.refreshQueue.run(async () => {
              const rt = this.tokenStore.getRefreshToken()
              if (!rt) throw new Error('No refresh token available')
              const refreshCfg = this.tokenStore.getConfig()
              const refreshRes = await this._pipeline<Record<string, unknown>>(
                'POST', refreshCfg.refreshEndpoint,
                { refreshToken: rt },
                { skipAuth: true, _isRefreshRequest: true },
              )
              const extract = refreshCfg.extractToken ?? ((d: unknown) => (d as Record<string, string>).accessToken)
              const token = extract(refreshRes.data)
              this.tokenStore.setAccessToken(token)
              return token
            })
            // Replay original request with new token
            iConfig._isRefreshRequest = true
            iConfig.headers = { ...(iConfig.headers ?? {}), [this.tokenStore.getConfig().headerName]: `${this.tokenStore.getConfig().scheme} ${newToken}` }
            return this._pipeline<T>(method, url, data, iConfig)
          } catch {
            // Requirement 5: Logout fallback
            this.tokenStore.clearTokens()
            dispatchLogout('token_refresh_failed')
          }
        }

        // Requirement 8: Retry on transient/5xx failures
        config._retryCount = (config._retryCount ?? 0) + 1
        if (await shouldRetry(apiError, config, method, this.retryCfg)) {
          const retryAfter = response.headers.get('Retry-After')
          await waitForRetry(config, this.retryCfg, retryAfter)
          this.log.warn(`↻ Retry ${config._retryCount}/${this.retryCfg.count} for ${method} ${url}`)
          return this._pipeline<T>(method, url, data, config)
        }

        throw apiError
      }

      // Requirement 12: Parse response (json, text, blob, arrayBuffer, stream)
      const parsed = await parseResponse<T>(response, iConfig.responseType)
      const respHeaders = flattenHeaders(response.headers)

      this.log.debug(`← ${response.status} ${fullUrl} [${elapsed}ms]`)

      let normalised: ApiResponse<T> = { data: parsed, status: response.status, headers: respHeaders, originalResponse: response }

      // Requirement 4: Run response interceptors (FIFO)
      normalised = (await this.interceptors.runResponse(normalised as ApiResponse<unknown>)) as ApiResponse<T>

      return normalised
    } catch (err) {
      clearTimeout(timer)
      if (ApiError.isApiError(err)) throw err

      // Requirement 9: Distinguish timeout vs user cancellation
      if (err instanceof DOMException && err.name === 'AbortError') {
        const reason = controller.signal.reason
        if (reason === 'timeout') throw ApiError.timeoutError(timeoutMs)
        throw ApiError.cancelledError(typeof reason === 'string' ? reason : undefined)
      }

      // Requirement 7: Network error
      const netErr = ApiError.networkError(err instanceof Error ? err : new Error(String(err)))

      // Requirement 8: Retry on network errors
      config._retryCount = (config._retryCount ?? 0) + 1
      if (await shouldRetry(netErr, config, method, this.retryCfg)) {
        await waitForRetry(config, this.retryCfg)
        this.log.warn(`↻ Retry ${config._retryCount}/${this.retryCfg.count} for ${method} ${url}`)
        return this._pipeline<T>(method, url, data, config)
      }

      throw netErr
    }
  }

  // ─── Requirement 1: Public HTTP methods with generics (Requirement 3: Type Safety) ──

  get<T = unknown>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('GET', url, undefined, config)
  }
  post<T = unknown, D = unknown>(url: string, data?: D, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('POST', url, data, config)
  }
  put<T = unknown, D = unknown>(url: string, data?: D, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', url, data, config)
  }
  patch<T = unknown, D = unknown>(url: string, data?: D, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', url, data, config)
  }
  delete<T = unknown>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', url, undefined, config)
  }

  // ─── Requirement 11: File upload with XHR progress fallback ────────────────

  upload<T = unknown>(url: string, body: FormData, config: UploadConfig = {}): Promise<ApiResponse<T>> {
    const { onProgress, signal, timeout, headers: extraHeaders, baseURL } = config
    const base = baseURL ?? this.baseURL
    const fullUrl = url.startsWith('http') ? url : `${base}${url}`
    const authHeaders = config.skipAuth ? {} : this.tokenStore.getAuthHeader()
    const mergedHeaders: Record<string, string> = { ...authHeaders, ...(extraHeaders ?? {}) }

    return new Promise<ApiResponse<T>>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', fullUrl, true)
      xhr.withCredentials = config.withCredentials ?? this.withCredentials
      xhr.timeout = timeout ?? this.timeout

      for (const [k, v] of Object.entries(mergedHeaders)) {
        if (k.toLowerCase() !== 'content-type') xhr.setRequestHeader(k, v)
      }

      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100), e.loaded, e.total)
        })
      }

      if (signal) signal.addEventListener('abort', () => xhr.abort())

      xhr.onload = () => {
        let data: T
        try { data = JSON.parse(xhr.responseText) as T } catch { data = xhr.responseText as unknown as T }
        const h: Record<string, string> = {}
        xhr.getAllResponseHeaders().trim().split(/\r?\n/).forEach(line => {
          const [key, ...rest] = line.split(':')
          if (key) h[key.trim().toLowerCase()] = rest.join(':').trim()
        })
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ data, status: xhr.status, headers: h, originalResponse: null as unknown as Response })
        } else {
          reject(new ApiError({ message: `Upload failed: ${xhr.status}`, status: xhr.status, data, headers: h, code: 'HTTP_ERROR', isHttpError: true }))
        }
      }
      xhr.onerror = () => reject(ApiError.networkError(new Error('Network error during upload')))
      xhr.ontimeout = () => reject(ApiError.timeoutError(timeout ?? this.timeout))
      xhr.send(body)
    })
  }

  // ─── Requirement 11: File download with streaming progress ─────────────────

  async download(url: string, config: DownloadConfig = {}): Promise<Blob> {
    const { filename, onProgress, signal, timeout, headers: extra, baseURL, mimeType, withCredentials } = config
    const base = baseURL ?? this.baseURL
    const fullUrl = url.startsWith('http') ? url : `${base}${url}`
    const authHeaders = config.skipAuth ? {} : this.tokenStore.getAuthHeader()

    const controller = new AbortController()
    if (signal) signal.addEventListener('abort', () => controller.abort())
    const timeoutMs = timeout ?? this.timeout
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: { ...authHeaders, ...(extra ?? {}) },
        credentials: (withCredentials ?? this.withCredentials) ? 'include' : 'same-origin',
        signal: controller.signal,
      })
      clearTimeout(timer)
      if (!response.ok) throw new ApiError({ message: `Download failed: ${response.status}`, status: response.status, code: 'HTTP_ERROR', isHttpError: true })

      const contentLength = response.headers.get('Content-Length')
      const total = contentLength ? parseInt(contentLength, 10) : null

      if (onProgress && response.body) {
        const reader = response.body.getReader()
        const chunks: Uint8Array[] = []
        let loaded = 0
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value)
          loaded += value.length
          onProgress(loaded, total)
        }
        const blob = new Blob(chunks as BlobPart[], { type: mimeType ?? response.headers.get('content-type') ?? 'application/octet-stream' })
        if (filename) triggerBrowserDownload(blob, filename)
        return blob
      }

      const blob = await response.blob()
      if (filename) triggerBrowserDownload(blob, filename)
      return blob
    } finally { clearTimeout(timer) }
  }

  // ─── Requirement 9: Cancellation helpers ───────────────────────────────────

  createAbortController(): AbortController { return new AbortController() }

  // ─── Requirement 5: Auth helpers ───────────────────────────────────────────

  setAuthToken(accessToken: string, refreshToken?: string) {
    this.tokenStore.setAccessToken(accessToken)
    if (refreshToken) this.tokenStore.setRefreshToken(refreshToken)
  }
  clearAuthToken() { this.tokenStore.clearTokens() }
  getAuthToken(): string | null { return this.tokenStore.getAccessToken() }

  // ─── Requirement 4: Interceptor registration ──────────────────────────────

  addRequestInterceptor(i: RequestInterceptor): () => void { return this.interceptors.addRequest(i) }
  addResponseInterceptor(i: ResponseInterceptor): () => void { return this.interceptors.addResponse(i) }

  // ─── Config helpers ────────────────────────────────────────────────────────

  setBaseURL(url: string) { this.baseURL = url }
  setLogLevel(level: 'debug' | 'info' | 'warn' | 'error' | 'silent') { this.log.setLevel(level) }
  setDefaultHeader(key: string, value: string) { this.defaultHeaders[key] = value }
  removeDefaultHeader(key: string) { delete this.defaultHeaders[key] }

  // ─── Child / factory ───────────────────────────────────────────────────────

  extend(overrides: ApiClientConfig): ApiClient {
    return new ApiClient({ baseURL: this.baseURL, logLevel: this.log.getLevel(), ...overrides })
  }
  static create(config?: ApiClientConfig): ApiClient { return new ApiClient(config) }
}

// ── Helper ───────────────────────────────────────────────────────────────────

function triggerBrowserDownload(blob: Blob, filename: string) {
  if (typeof document === 'undefined') return
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.style.display = 'none'
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
