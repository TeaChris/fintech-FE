import { Button } from '@/components'

export function CtaSection() {
  return (
    <section className="py-32 bg-background border-b border-border">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-page-title mb-6">
          Ready to upgrade your financial stack?
        </h2>
        <p className="text-body text-muted-foreground mx-auto mb-10 max-w-2xl text-balance">
          Join thousands of forward-thinking companies that have chosen VaultPay to process billions in global volume. Create an account instantly or talk to our experts.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button size="lg" className="rounded-full px-8">
            Create account
          </Button>
          <Button size="lg" variant="outline" className="rounded-full px-8">
            Contact sales
          </Button>
        </div>
      </div>
    </section>
  )
}
