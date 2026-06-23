/**
 * Example Server Action integrations using the API client SDK.
 *
 * Server Actions run on the server and can:
 * - Access cookies (auth forwarding)
 * - Call APIs securely (no client-side exposure)
 * - Revalidate caches after mutations
 * - Return typed results to the client
 */

"use server";

import type { ZodType } from "zod";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { createServerClient } from "./server-fetcher";
import { validatePayload } from "@/api/client/validation";
import type { Transfer, TransferRequest } from "@/api/schemas";
import { isApiError, isValidationError } from "@/api/client/errors";
import { TransferSchema, TransferRequestSchema } from "@/api/schemas";
import { requireAuth } from "@/features/auth/guards/auth.guard";

// ---------------------------------------------------------------------------
// Transfer Server Action
// ---------------------------------------------------------------------------

/**
 * Server Action result — discriminated union for client consumption.
 */
// ---------------------------------------------------------------------------
// CSRF Protection for Server Actions
// ---------------------------------------------------------------------------

/**
 * Validate that a Server Action request includes a valid Origin header.
 * This provides defense-in-depth CSRF protection for financial mutations
 * beyond Next.js's built-in action ID mechanism.
 */
async function validateOrigin(): Promise<boolean> {
      const headerStore = await headers();
      const origin = headerStore.get('origin');
      const host = headerStore.get('host');

      if (!origin || !host) {
            // Missing headers — reject for safety
            return false;
      }

      try {
            const originHost = new URL(origin).host;
            return originHost === host;
      } catch {
            return false;
      }
}

export type ActionResult<T> =
      | { success: true; data: T }
      | {
              success: false;
              error: string;
              fieldErrors?: Record<string, string[]>;
        };

/**
 * Create a new transfer via Server Action.
 *
 * This is the recommended pattern for financial mutations:
 * 1. Validate the payload on the server (never trust client input)
 * 2. Create a server client with cookie forwarding
 * 3. Call the API with `isFinancialMutation: true`
 * 4. Revalidate affected caches
 * 5. Return a typed result
 *
 * @example
 * ```tsx
 * // In a client component
 * 'use client';
 * import { createTransferAction } from '@/api/server';
 *
 * function TransferForm() {
 *   async function handleSubmit(formData: FormData) {
 *     const result = await createTransferAction({
 *       sourceAccountId: formData.get('sourceAccountId') as string,
 *       destinationAccountNumber: formData.get('destAccount') as string,
 *       destinationBankCode: formData.get('bankCode') as string,
 *       amount: { amount: formData.get('amount') as string, currency: 'NGN' },
 *       narration: formData.get('narration') as string,
 *       pin: formData.get('pin') as string,
 *     });
 *
 *     if (result.success) {
 *       toast.success(`Transfer ${result.data.reference} completed`);
 *     } else {
 *       toast.error(result.error);
 *     }
 *   }
 * }
 * ```
 */
export async function createTransferAction(
      payload: TransferRequest,
): Promise<ActionResult<Transfer>> {
      try {
            // 0. Auth: Reject unauthenticated requests
            await requireAuth();

            // 1. CSRF: Validate Origin header for financial mutations
            const originValid = await validateOrigin();
            if (!originValid) {
                  return {
                        success: false,
                        error: 'Invalid request origin. Please try again.',
                  };
            }

            // 1. Validate the payload on the server
            const validatedPayload = validatePayload(
                  TransferRequestSchema,
                  payload,
            );

            // 2. Create a server client with cookie forwarding
            const client = await createServerClient();

            // 3. Call the API with financial mutation safety
            const response = await client.post<Transfer>("/transfers", {
                  body: validatedPayload,
                  schema: TransferSchema as unknown as ZodType,
                  isFinancialMutation: true,
            });

            // 4. Revalidate affected caches
            revalidatePath("/accounts");
            revalidatePath("/transfers");

            // 5. Return success
            return { success: true, data: response.data };
      } catch (error) {
            // Map errors to user-friendly messages
            if (isValidationError(error)) {
                  return {
                        success: false,
                        error: error.message,
                        fieldErrors: error.fieldErrors,
                  };
            }

            if (isApiError(error)) {
                  return {
                        success: false,
                        error: error.message,
                  };
            }

            return {
                  success: false,
                  error: "An unexpected error occurred. Please try again.",
            };
      }
}
