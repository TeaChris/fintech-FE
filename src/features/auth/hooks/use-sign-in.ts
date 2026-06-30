import { useState, useTransition } from 'react'
import { redirect } from 'next/navigation'

import { signInAction } from '../actions/auth.actions'
import { DEFAULT_AUTHENTICATED_PATH } from '../auth.config'
import type { LoginRequest } from '@/api/sdk/auth/auth.api'

export function useSignIn() {
      // const searchParams = useSearchParams()
      const [isPending, startTransition] = useTransition()
      const [error, setError] = useState<string | null>(null)
      const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>(
            {},
      )

      const signIn = (payload: LoginRequest) => {
            setError(null)
            setFieldErrors({})

            startTransition(async () => {
                  const result = await signInAction(payload)

                  if (result.success) {
                        // If MFA is required, redirect to MFA challenge
                        if (
                              'mfaRequired' in result.data &&
                              result.data.mfaRequired
                        ) {
                              redirect(
                                    `/mfa?challenge=${encodeURIComponent(result.data.mfaChallengeToken)}`,
                              )
                        } else {
                              // Redirect to the original destination or dashboard
                              const redirectTo =
                                    // searchParams.get('redirect') ??
                                    DEFAULT_AUTHENTICATED_PATH
                              redirect(redirectTo)
                        }
                  } else {
                        setError(result.error)
                        if (result.fieldErrors) {
                              setFieldErrors(result.fieldErrors)
                        }
                  }
            })
      }

      return {
            error,
            signIn,
            isPending,
            fieldErrors,
      }
}
