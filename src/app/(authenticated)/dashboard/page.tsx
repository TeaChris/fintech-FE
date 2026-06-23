import type { Metadata } from 'next'

export const metadata: Metadata = {
      title: 'Dashboard — BpaY',
      description: 'Your BpaY financial dashboard overview.',
}

export default function DashboardPage() {
      return (
            <div className="flex flex-1 flex-col items-center justify-center p-8">
                  <div className="max-w-2xl text-center space-y-4">
                        <h1 className="text-3xl font-bold tracking-tight">
                              Dashboard
                        </h1>
                        <p className="text-muted-foreground text-lg">
                              Welcome to your BpaY dashboard. Your financial overview will appear here.
                        </p>
                  </div>
            </div>
      )
}
