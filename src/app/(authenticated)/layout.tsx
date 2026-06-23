/**
 * Authenticated layout — server-side session validation gate.
 *
 * This layout is the SECOND layer of defense (after middleware):
 * 1. Middleware checks cookie presence (fast, no network call)
 * 2. This layout validates the session with the backend (GET /auth/me)
 * 3. If invalid → redirect to sign-in (handles expired/revoked tokens)
 * 4. If valid → provides AuthUser context to all children
 *
 * All routes under (authenticated)/ inherit this protection automatically.
 * Children never render without a validated user.
 */

import { redirect } from 'next/navigation'
import { getAuthUser } from '@/features/auth/guards/auth.guard'
import { AuthProvider } from '@/features/auth/components/auth-provider'
import { SIGN_IN_PATH } from '@/features/auth/auth.config'

export default async function AuthenticatedLayout({
      children,
}: Readonly<{
      children: React.ReactNode
}>) {
      const user = await getAuthUser()

      if (!user) {
            // Session cookie exists (middleware let us through) but token is
            // invalid/expired. Redirect to sign-in.
            redirect(SIGN_IN_PATH)
      }

      return <AuthProvider user={user}>{children}</AuthProvider>
}
