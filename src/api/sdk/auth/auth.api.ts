/**
 * Auth SDK module — login, logout, refresh, profile.
 */

import type { ApiClient, ApiResponse } from "@/api/types";
import { z } from "zod";
import type { ZodType } from "zod";

// ---------------------------------------------------------------------------
// Auth Schemas (self-contained — auth is a special domain)
// ---------------------------------------------------------------------------

export const LoginRequestSchema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const AuthUserSchema = z.object({
      role: z.string(),
      lastName: z.string(),
      id: z.string().min(1),
      firstName: z.string(),
      email: z.string().email(),
      lastLoginAt: z.string().optional(),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const LoginResponseSchema = z.object({
      user: AuthUserSchema,
      expiresAt: z.string(),
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------

export interface AuthApi {
      login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>>;
      logout(): Promise<ApiResponse<null>>;
      getProfile(): Promise<ApiResponse<AuthUser>>;
}

export function createAuthApi(client: ApiClient): AuthApi {
      return {
            login: (credentials: LoginRequest) =>
                  client.post<LoginResponse>("/auth/login", {
                        body: credentials,
                        schema: LoginResponseSchema as unknown as ZodType,
                        skipAuth: true,
                  }),

            logout: () =>
                  client.post<null>("/auth/logout", {
                        responseType: "empty",
                  }),

            getProfile: () =>
                  client.get<AuthUser>("/auth/profile", {
                        schema: AuthUserSchema as unknown as ZodType,
                  }),
      };
}
