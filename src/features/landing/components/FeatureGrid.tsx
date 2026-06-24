import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components'
import { Activity, CreditCard, Globe, Lock, RefreshCw, Zap } from 'lucide-react'

const features = [
  {
    title: 'Global Payments',
    description: 'Accept payments in 135+ currencies and dozens of payment methods natively.',
    icon: Globe,
  },
  {
    title: 'Automated Reconciliation',
    description: 'Stop manually matching bank transfers. Our ledger automates the heavy lifting.',
    icon: RefreshCw,
  },
  {
    title: 'High Authorization Rates',
    description: 'Machine learning routing optimizations increase your revenue automatically.',
    icon: Activity,
  },
  {
    title: 'Instant Payouts',
    description: 'Access your funds instantly instead of waiting days for standard ACH transfers.',
    icon: Zap,
  },
  {
    title: 'Fraud Protection',
    description: 'Dynamic 3D Secure and anomaly detection shield you from chargebacks.',
    icon: Lock,
  },
  {
    title: 'Virtual Cards',
    description: 'Issue physical or virtual corporate cards with programmatic spend controls.',
    icon: CreditCard,
  },
]

export function FeatureGrid() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-16">
          <h2 className="text-section-title mb-4">
            A fully integrated suite of financial products
          </h2>
          <p className="text-body text-muted-foreground">
            We bring together everything that&apos;s required to build websites and apps that accept payments and send payouts globally. VaultPay&apos;s products power payments for online and in-person retailers, subscriptions businesses, software platforms and marketplaces.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="bg-card hover:border-border transition-colors group overflow-hidden border-border/60 shadow-none hover:shadow-sm">
                <CardHeader>
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-4 group-hover:bg-accent/10 transition-colors">
                    <Icon className="h-5 w-5 text-foreground group-hover:text-accent transition-colors" />
                  </div>
                  <CardTitle className="text-card-title">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-body-sm">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
