import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldX } from 'lucide-react'

export const metadata: Metadata = {
      title: 'Access Denied — BpaY',
      description: 'You do not have permission to access this page.',
}

export default function AccessDeniedPage() {
      return (
            <div className="flex flex-1 flex-col items-center justify-center p-8">
                  <div className="max-w-md text-center space-y-6">
                        <div className="flex items-center justify-center">
                              <div className="flex items-center justify-center size-16 rounded-full bg-destructive/10">
                                    <ShieldX className="size-8 text-destructive" />
                              </div>
                        </div>

                        <div className="space-y-2">
                              <h1 className="text-2xl font-bold tracking-tight">
                                    Access Denied
                              </h1>
                              <p className="text-muted-foreground">
                                    You don&apos;t have permission to access this page.
                                    If you believe this is an error, contact your
                                    administrator.
                              </p>
                        </div>

                        <Link
                              href="/dashboard"
                              className="inline-flex h-10 items-center justify-center rounded-xl bg-accent px-6 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
                        >
                              Back to Dashboard
                        </Link>
                  </div>
            </div>
      )
}
