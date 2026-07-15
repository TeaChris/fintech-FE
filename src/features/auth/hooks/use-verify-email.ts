'use client'

import { useState, useTransition } from 'react'
import { verifyEmailAction } from '../actions/auth.actions'
import type { VerifyEmailRequest } from '@/api/sdk/auth/auth.api'

export function useVerifyEmail() {
      const [isPending, startTransition] = useTransition()
      const [error, setError] = useState<string | null>(null)
      const [success, setSuccess] = useState(false)

      const verifyEmail = (payload: VerifyEmailRequest) => {
            setError(null)
            setSuccess(false)

            startTransition(async () => {
                  const result = await verifyEmailAction(payload)

                  if (result.success) {
                        setSuccess(true)
                  } else {
                        setError(result.error)
                  }
            })
      }

      return {
            error,
            success,
            isPending,
            verifyEmail,
      }
}
