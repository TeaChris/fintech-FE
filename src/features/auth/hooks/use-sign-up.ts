import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signUpAction } from '../actions/auth.actions'
import type { RegisterRequest } from '@/api/sdk/auth/auth.api'

export function useSignUp() {
      const router = useRouter()
      const [isPending, startTransition] = useTransition()
      const [error, setError] = useState<string | null>(null)
      const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>(
            {},
      )

      const signUp = (payload: RegisterRequest) => {
            setError(null)
            setFieldErrors({})

            startTransition(async () => {
                  const result = await signUpAction(payload)

                  if (result.success) {
                        // Redirect to email verification or dashboard
                        const query = new URLSearchParams({ email: payload.email }).toString();
                        router.push(`/verify-email?${query}`);
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
            signUp,
            setError,
            isPending,
            fieldErrors,
      }
}
