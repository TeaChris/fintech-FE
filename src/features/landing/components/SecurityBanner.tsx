import { Shield, LockKeyhole, Server } from 'lucide-react'

export function SecurityBanner() {
  return (
    <section className="py-24 bg-foreground text-background">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-16">
          <h2 className="text-section-title mb-4 text-background">
            Enterprise-grade security by default
          </h2>
          <p className="text-body text-background/80">
            VaultPay is a certified PCI Service Provider Level 1. This is the most stringent level of certification available in the payments industry. Your customers&apos; data is encrypted using AES-256 and never touches your servers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-background/20 pt-12">
          <div>
            <div className="w-10 h-10 rounded mb-6 flex items-center justify-start">
              <Shield className="h-6 w-6 text-background/90" />
            </div>
            <h4 className="font-heading font-semibold text-lg mb-2 text-background">SOC 2 Type II</h4>
            <p className="text-body-sm text-background/70">
              We are audited annually by independent third-parties to ensure our security practices exceed industry standards for availability, processing integrity, and confidentiality.
            </p>
          </div>
          
          <div>
            <div className="w-10 h-10 rounded mb-6 flex items-center justify-start">
              <LockKeyhole className="h-6 w-6 text-background/90" />
            </div>
            <h4 className="font-heading font-semibold text-lg mb-2 text-background">End-to-End Encryption</h4>
            <p className="text-body-sm text-background/70">
              All card numbers are encrypted on disk with AES-256. Decryption keys are stored on separate machines to prevent unauthorized access.
            </p>
          </div>
          
          <div>
            <div className="w-10 h-10 rounded mb-6 flex items-center justify-start">
              <Server className="h-6 w-6 text-background/90" />
            </div>
            <h4 className="font-heading font-semibold text-lg mb-2 text-background">99.999% Uptime</h4>
            <p className="text-body-sm text-background/70">
              Our infrastructure spans multiple geographic regions with active-active redundancy, ensuring your payment flows continue uninterrupted during outages.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
