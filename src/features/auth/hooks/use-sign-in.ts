import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { signInAction } from '../actions/auth.actions'
import type { LoginRequest } from '@/api/sdk/auth/auth.api'

export function useSignIn() {
      const router = useRouter()
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
                        // Assuming login success means we redirect to dashboard
                        // If MFA is required, we would check result.data.mfaRequired
                        if (
                              'mfaRequired' in result.data &&
                              result.data.mfaRequired
                        ) {
                              // Route to MFA challenge page
                              router.push(
                                    `/mfa-verification?challenge=${encodeURIComponent(result.data.mfaChallengeToken)}`,
                              )
                        } else {
                              router.push('/dashboard')
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
