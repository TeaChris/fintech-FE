import Link from 'next/link'
import { Hexagon } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="bg-background py-16">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <Hexagon className="h-6 w-6 text-foreground" />
              <span className="font-heading font-semibold text-foreground text-base tracking-tight">
                VaultPay
              </span>
            </Link>
            <p className="text-body-sm max-w-sm mb-6">
              Financial infrastructure for the internet economy. We build elegant tools that help companies move money seamlessly.
            </p>
          </div>
          
          <div>
            <h4 className="font-heading font-semibold text-sm mb-4">Products</h4>
            <ul className="space-y-3">
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Payments</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Checkout</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Billing</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Connect</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-heading font-semibold text-sm mb-4">Developers</h4>
            <ul className="space-y-3">
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Documentation</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">API Reference</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">API Status</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-heading font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-3">
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Customers</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Careers</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border/60">
          <p className="text-caption mb-4 md:mb-0">
            © {currentYear} VaultPay, Inc. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-caption hover:text-foreground transition-colors">Privacy</Link>
            <Link href="#" className="text-caption hover:text-foreground transition-colors">Terms</Link>
            <Link href="#" className="text-caption hover:text-foreground transition-colors">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
