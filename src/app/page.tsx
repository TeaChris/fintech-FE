import {
  Navbar,
  Hero,
  TrustStrip,
  FeatureGrid,
  PlatformShowcase,
  SecurityBanner,
  CtaSection,
  Footer
} from '@/features/landing/components'

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <TrustStrip />
        <FeatureGrid />
        <PlatformShowcase />
        <SecurityBanner />
        <CtaSection />
      </main>
      <Footer />
    </div>
  )
}
