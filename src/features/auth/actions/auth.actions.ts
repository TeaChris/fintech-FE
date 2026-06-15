'use server'

import { cookies, headers } from 'next/headers'
import { createServerClient } from '@/api/server'
import * as setCookieParser from 'set-cookie-parser'
import { createAuthApi } from '@/api/sdk/auth/auth.api'
import { validatePayload } from '@/api/client/validation'
import { isApiError, isValidationError } from '@/api/client/errors'

import {
      LoginRequestSchema,
      type LoginRequest,
      type LoginResponse,
      RegisterRequestSchema,
      type RegisterRequest,
      type RegisterResponse,
} from '@/api/sdk/auth/auth.api'
/**
 * Server Action result — discriminated union for client consumption.
 */
export type ActionResult<T> =
      | { success: true; data: T }
      | {
              success: false
              error: string
              fieldErrors?: Record<string, string[]>
        }

/**
 * Validate that a Server Action request includes a valid Origin header.
 * This provides defense-in-depth CSRF protection.
 */
async function validateOrigin(): Promise<boolean> {
      const headerStore = await headers()
      const origin = headerStore.get('origin')
      const host = headerStore.get('host')

      if (!origin || !host) {
            // Missing headers — reject for safety
            return false
      }

      try {
            const originHost = new URL(origin).host
            return originHost === host
      } catch {
            return false
      }
}

/**
 * Sign in a user via Server Action.
 *
 * This function:
 * 1. Validates the origin for CSRF protection.
 * 2. Validates the incoming payload structure.
 * 3. Calls the backend login endpoint securely.
 * 4. Extracts `Set-Cookie` headers from the response and explicitly sets them
 *    in the Next.js `cookies()` store, ensuring the client receives its tokens.
 */
export async function signInAction(
      payload: LoginRequest,
): Promise<ActionResult<LoginResponse>> {
      try {
            // 1. CSRF validation
            const originValid = await validateOrigin()
            if (!originValid) {
                  return {
                        success: false,
                        error: 'Invalid request origin. Please try again.',
                  }
            }

            // 2. Validate payload on the server
            const validatedPayload = validatePayload(
                  LoginRequestSchema,
                  payload,
            )

            // 3. Call backend using Server Client
            const client = await createServerClient()
            const authApi = createAuthApi(client)

            const response = await authApi.login(validatedPayload)

            // 4. Extract and forward cookies to the client
            // Node 18+ Headers API provides `getSetCookie()` to cleanly extract all Set-Cookie values
            const setCookieHeaders = response.headers.getSetCookie
                  ? response.headers.getSetCookie()
                  : []

            if (setCookieHeaders.length > 0) {
                  const parsedCookies = setCookieParser.parse(setCookieHeaders)
                  const cookieStore = await cookies()

                  for (const cookie of parsedCookies) {
                        cookieStore.set(cookie.name, cookie.value, {
                              path: cookie.path ?? '/',
                              httpOnly: cookie.httpOnly ?? true,
                              secure: cookie.secure ?? true,
                              sameSite: cookie.sameSite as
                                    | 'lax'
                                    | 'strict'
                                    | 'none'
                                    | undefined,
                              domain: cookie.domain,
                              expires: cookie.expires,
                              maxAge: cookie.maxAge,
                        })
                  }
            }

            // 5. Return success result
            return { success: true, data: response.data }
      } catch (error) {
            // Map errors to user-friendly messages
            if (isValidationError(error)) {
                  return {
                        success: false,
                        error: error.message,
                        fieldErrors: error.fieldErrors,
                  }
            }

            if (isApiError(error)) {
                  return {
                        success: false,
                        error: error.message,
                  }
            }

            return {
                  success: false,
                  error: 'An unexpected error occurred. Please try again.',
            }
      }
}

/**
 * Register a new user via Server Action.
 */
export async function signUpAction(
      payload: RegisterRequest,
): Promise<ActionResult<RegisterResponse>> {
      try {
            // 1. CSRF validation
            const originValid = await validateOrigin()
            if (!originValid) {
                  return {
                        success: false,
                        error: 'Invalid request origin. Please try again.',
                  }
            }

            // 2. Validate payload on the server
            const validatedPayload = validatePayload(
                  RegisterRequestSchema,
                  payload,
            )

            // 3. Call backend using Server Client
            const client = await createServerClient()
            const authApi = createAuthApi(client)

            const response = await authApi.register(validatedPayload)

            // 4. Extract and forward cookies to the client (registration may auto-login and return cookies)
            const setCookieHeaders = response.headers.getSetCookie
                  ? response.headers.getSetCookie()
                  : []

            if (setCookieHeaders.length > 0) {
                  const parsedCookies = setCookieParser.parse(setCookieHeaders)
                  const cookieStore = await cookies()

                  for (const cookie of parsedCookies) {
                        cookieStore.set(cookie.name, cookie.value, {
                              path: cookie.path ?? '/',
                              httpOnly: cookie.httpOnly ?? true,
                              secure: cookie.secure ?? true,
                              sameSite: cookie.sameSite as
                                    | 'lax'
                                    | 'strict'
                                    | 'none'
                                    | undefined,
                              domain: cookie.domain,
                              expires: cookie.expires,
                              maxAge: cookie.maxAge,
                        })
                  }
            }

            // 5. Return success result
            return { success: true, data: response.data }
      } catch (error) {
            // Map errors to user-friendly messages
            if (isValidationError(error)) {
                  return {
                        success: false,
                        error: error.message,
                        fieldErrors: error.fieldErrors,
                  }
            }

            if (isApiError(error)) {
                  return {
                        success: false,
                        error: error.message,
                  }
            }

            return {
                  success: false,
                  error: 'An unexpected error occurred. Please try again.',
            }
      }
}
