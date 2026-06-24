import Link from 'next/link'
import { Button } from '@/components'
import { Hexagon } from 'lucide-react'

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <Hexagon className="h-6 w-6 text-foreground group-hover:text-accent transition-colors" />
              <span className="font-heading font-semibold text-foreground text-base tracking-tight">
                VaultPay
              </span>
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link href="#products" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Products
              </Link>
              <Link href="#developers" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Developers
              </Link>
              <Link href="#company" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Company
              </Link>
              <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Button size="sm" className="rounded-full px-5">
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
