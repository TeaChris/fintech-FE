/**
 * Auth SDK module — complete authentication, MFA, and session management.
 *
 * Aligned with the PAY backend (Hono) auth routes:
 *   /auth/login, /auth/register, /auth/logout, /auth/refresh,
 *   /auth/verify-email, /auth/request-password-reset, /auth/reset-password,
 *   /auth/me, /auth/mfa/setup, /auth/mfa/verify, /auth/mfa/disable,
 *   /auth/sessions, /auth/sessions/:id
 */

import { z } from 'zod'
import type { ZodType } from 'zod'
import type { ApiClient, ApiResponse } from '@/api/types'
import { ROLES } from '@/features/auth/rbac/rbac.constants'

// ---------------------------------------------------------------------------
// Shared Schemas
// ---------------------------------------------------------------------------

/**
 * Generic message response — most auth endpoints return this shape
 * (after the backend envelope is unwrapped by the response parser).
 */
export const MessageResponseSchema = z.object({
      message: z.string(),
})
export type MessageResponse = z.infer<typeof MessageResponseSchema>

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export const LoginRequestSchema = z.object({
      email: z.string().email(),
      password: z.string().min(1),
})
export type LoginRequest = z.infer<typeof LoginRequestSchema>

/** Standard login success (no MFA). Tokens are in HttpOnly cookies. */
export const LoginSuccessResponseSchema = MessageResponseSchema
export type LoginSuccessResponse = MessageResponse

/**
 * Login response when MFA is required.
 * The client must redirect to the MFA verification page and pass
 * the `mfaChallengeToken` to `/auth/mfa/verify`.
 */
export const LoginMfaResponseSchema = z.object({
      mfaRequired: z.literal(true),
      mfaChallengeToken: z.string(),
})
export type LoginMfaResponse = z.infer<typeof LoginMfaResponseSchema>

/**
 * Union of possible login responses.
 * The client should check for `mfaRequired` to determine the flow.
 */
export const LoginResponseSchema = z.union([
      LoginMfaResponseSchema,
      LoginSuccessResponseSchema,
])
export type LoginResponse = z.infer<typeof LoginResponseSchema>

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

export const RegisterRequestSchema = z.object({
      email: z.string().email().max(255),
      password: z.string().min(8).max(128),
      displayName: z.string().max(100).optional(),
})
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>

export const RegisterResponseSchema = z.object({
      message: z.string(),
      userId: z.string(),
})
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>

// ---------------------------------------------------------------------------
// Email Verification
// ---------------------------------------------------------------------------

export const VerifyEmailRequestSchema = z.object({
      token: z.string().min(1),
})
export type VerifyEmailRequest = z.infer<typeof VerifyEmailRequestSchema>

// ---------------------------------------------------------------------------
// Password Reset
// ---------------------------------------------------------------------------

export const ForgotPasswordRequestSchema = z.object({
      email: z.string().email(),
})
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>

export const ResetPasswordRequestSchema = z.object({
      token: z.string().min(1),
      password: z.string().min(8).max(128),
})
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>

// ---------------------------------------------------------------------------
// User Profile (GET /auth/me)
// ---------------------------------------------------------------------------

export const AuthUserSchema = z.object({
      id: z.string().min(1),
      email: z.string().email(),
      // Role must match PAY backend DEFAULT_ROLES.
      // Using z.enum for compile-time safety.
      role: z.enum(ROLES),
      displayName: z.string().nullable(),
      emailVerified: z.boolean(),
      mfaEnabled: z.boolean(),
      createdAt: z.string().or(z.date()),
})
export type AuthUser = z.infer<typeof AuthUserSchema>

// ---------------------------------------------------------------------------
// MFA
// ---------------------------------------------------------------------------

export const MfaSetupResponseSchema = z.object({
      secret: z.string(),
      qrCodeDataUrl: z.string(),
      recoveryCodes: z.array(z.string()),
})
export type MfaSetupResponse = z.infer<typeof MfaSetupResponseSchema>

export const MfaVerifyRequestSchema = z.object({
      code: z.string().min(1).max(20),
      mfaChallengeToken: z.string().optional(),
})
export type MfaVerifyRequest = z.infer<typeof MfaVerifyRequestSchema>

export const MfaDisableRequestSchema = z.object({
      password: z.string().min(1),
      code: z.string().min(1).max(20),
})
export type MfaDisableRequest = z.infer<typeof MfaDisableRequestSchema>

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export const SessionInfoSchema = z.object({
      id: z.string(),
      current: z.boolean(),
      ipAddress: z.string().nullable(),
      userAgent: z.string().nullable(),
      deviceName: z.string().nullable(),
      deviceType: z.string().nullable(),
      createdAt: z.string().or(z.date()),
      lastActiveAt: z.string().or(z.date()),
})
export type SessionInfo = z.infer<typeof SessionInfoSchema>

// ---------------------------------------------------------------------------
// Auth API Interface
// ---------------------------------------------------------------------------

export interface AuthApi {
      // Core auth
      login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>>
      register(data: RegisterRequest): Promise<ApiResponse<RegisterResponse>>
      logout(): Promise<ApiResponse<null>>
      refresh(): Promise<ApiResponse<null>>

      // Profile
      getProfile(): Promise<ApiResponse<AuthUser>>

      // Email verification
      verifyEmail(
            data: VerifyEmailRequest,
      ): Promise<ApiResponse<MessageResponse>>

      // Password reset
      forgotPassword(
            data: ForgotPasswordRequest,
      ): Promise<ApiResponse<MessageResponse>>
      resetPassword(
            data: ResetPasswordRequest,
      ): Promise<ApiResponse<MessageResponse>>

      // MFA
      mfaSetup(): Promise<ApiResponse<MfaSetupResponse>>
      mfaVerify(data: MfaVerifyRequest): Promise<ApiResponse<MessageResponse>>
      mfaDisable(data: MfaDisableRequest): Promise<ApiResponse<MessageResponse>>

      // Sessions
      getSessions(): Promise<ApiResponse<SessionInfo[]>>
      revokeSession(id: string): Promise<ApiResponse<MessageResponse>>
}

// ---------------------------------------------------------------------------
// Auth API Factory
// ---------------------------------------------------------------------------

export function createAuthApi(client: ApiClient): AuthApi {
      return {
            // ── Core Auth ──────────────────────────────────────────────
            login: (credentials: LoginRequest) =>
                  client.post<LoginResponse>('/auth/login', {
                        body: credentials,
                        schema: LoginResponseSchema as unknown as ZodType,
                        skipAuth: true,
                  }),

            register: (data: RegisterRequest) =>
                  client.post<RegisterResponse>('/auth/register', {
                        body: data,
                        schema: RegisterResponseSchema as unknown as ZodType,
                        skipAuth: true,
                  }),

            logout: () =>
                  client.post<null>('/auth/logout', {
                        responseType: 'empty',
                  }),

            refresh: () =>
                  client.post<null>('/auth/refresh', {
                        responseType: 'empty',
                        skipAuth: true,
                  }),

            // ── Profile ────────────────────────────────────────────────
            getProfile: () =>
                  client.get<AuthUser>('/auth/me', {
                        schema: AuthUserSchema as unknown as ZodType,
                  }),

            // ── Email Verification ─────────────────────────────────────
            verifyEmail: (data: VerifyEmailRequest) =>
                  client.post<MessageResponse>('/auth/verify-email', {
                        body: data,
                        schema: MessageResponseSchema as unknown as ZodType,
                        skipAuth: true,
                  }),

            // ── Password Reset ─────────────────────────────────────────
            forgotPassword: (data: ForgotPasswordRequest) =>
                  client.post<MessageResponse>('/auth/request-password-reset', {
                        body: data,
                        schema: MessageResponseSchema as unknown as ZodType,
                        skipAuth: true,
                  }),

            resetPassword: (data: ResetPasswordRequest) =>
                  client.post<MessageResponse>('/auth/reset-password', {
                        body: data,
                        schema: MessageResponseSchema as unknown as ZodType,
                        skipAuth: true,
                  }),

            // ── MFA ────────────────────────────────────────────────────
            mfaSetup: () =>
                  client.post<MfaSetupResponse>('/auth/mfa/setup', {
                        schema: MfaSetupResponseSchema as unknown as ZodType,
                  }),

            mfaVerify: (data: MfaVerifyRequest) =>
                  client.post<MessageResponse>('/auth/mfa/verify', {
                        body: data,
                        schema: MessageResponseSchema as unknown as ZodType,
                        skipAuth: true,
                  }),

            mfaDisable: (data: MfaDisableRequest) =>
                  client.post<MessageResponse>('/auth/mfa/disable', {
                        body: data,
                        schema: MessageResponseSchema as unknown as ZodType,
                  }),

            // ── Sessions ───────────────────────────────────────────────
            getSessions: () =>
                  client.get<SessionInfo[]>('/auth/sessions', {
                        schema: z.array(
                              SessionInfoSchema,
                        ) as unknown as ZodType,
                  }),

            revokeSession: (id: string) =>
                  client.del<MessageResponse>(`/auth/sessions/${id}`, {
                        schema: MessageResponseSchema as unknown as ZodType,
                  }),
      }
}
