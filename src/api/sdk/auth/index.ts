// Core factory
export { createAuthApi } from './auth.api'
export type { AuthApi } from './auth.api'

// Shared
export { MessageResponseSchema } from './auth.api'
export type { MessageResponse } from './auth.api'

// Login
export { LoginRequestSchema, LoginResponseSchema, LoginSuccessResponseSchema, LoginMfaResponseSchema } from './auth.api'
export type { LoginRequest, LoginResponse, LoginSuccessResponse, LoginMfaResponse } from './auth.api'

// Register
export { RegisterRequestSchema, RegisterResponseSchema } from './auth.api'
export type { RegisterRequest, RegisterResponse } from './auth.api'

// Email verification
export { VerifyEmailRequestSchema } from './auth.api'
export type { VerifyEmailRequest } from './auth.api'

// Password reset
export { ForgotPasswordRequestSchema, ResetPasswordRequestSchema } from './auth.api'
export type { ForgotPasswordRequest, ResetPasswordRequest } from './auth.api'

// Profile
export { AuthUserSchema } from './auth.api'
export type { AuthUser } from './auth.api'

// MFA
export { MfaSetupResponseSchema, MfaVerifyRequestSchema, MfaDisableRequestSchema } from './auth.api'
export type { MfaSetupResponse, MfaVerifyRequest, MfaDisableRequest } from './auth.api'

// Sessions
export { SessionInfoSchema } from './auth.api'
export type { SessionInfo } from './auth.api'
