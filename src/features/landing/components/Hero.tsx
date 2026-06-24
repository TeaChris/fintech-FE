import { Button } from '@/components'
import { ArrowRight, ChevronRight } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24 lg:pt-40 lg:pb-32">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          <a
            href="#changelog"
            className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors mb-8"
          >
            <span className="flex h-2 w-2 rounded-full bg-accent mr-2"></span>
            Announcing VaultPay Enterprise
            <ChevronRight className="ml-1 h-4 w-4" />
          </a>
          
          <h1 className="text-display mb-6">
            Financial infrastructure for the internet economy
          </h1>
          
          <p className="text-body text-muted-foreground md:text-lg mb-10 max-w-2xl text-balance">
            Millions of companies of all sizes—from startups to Fortune 500s—use VaultPay&apos;s software and APIs to accept payments, send payouts, and manage their businesses online.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button size="lg" className="rounded-full px-8 gap-2 group">
              Start building
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8">
              Contact sales
            </Button>
          </div>
        </div>
      </div>
      
      {/* Subtle background abstract element without gradients to adhere to 'No large gradients' rule */}
      <div className="absolute top-0 inset-x-0 h-px bg-border"></div>
      <div className="absolute top-0 right-1/4 w-px h-full bg-border/50"></div>
      <div className="absolute top-0 left-1/4 w-px h-full bg-border/50"></div>
    </section>
  )
}
