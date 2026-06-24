import { Command, Compass, Cpu, Hexagon, Box, Triangle } from 'lucide-react'

export function TrustStrip() {
  return (
    <section className="py-12 border-y border-border/50 bg-muted/30">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-medium text-muted-foreground mb-8 uppercase tracking-widest">
          Trusted by the world&apos;s most innovative teams
        </p>
        
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="flex items-center gap-2">
            <Hexagon className="h-6 w-6" />
            <span className="font-heading font-semibold text-lg tracking-tight">Acme</span>
          </div>
          <div className="flex items-center gap-2">
            <Triangle className="h-6 w-6" />
            <span className="font-heading font-semibold text-lg tracking-tight">Quantum</span>
          </div>
          <div className="flex items-center gap-2">
            <Box className="h-6 w-6" />
            <span className="font-heading font-semibold text-lg tracking-tight">Echo</span>
          </div>
          <div className="flex items-center gap-2">
            <Compass className="h-6 w-6" />
            <span className="font-heading font-semibold text-lg tracking-tight">Nova</span>
          </div>
          <div className="flex items-center gap-2">
            <Command className="h-6 w-6" />
            <span className="font-heading font-semibold text-lg tracking-tight">Linear</span>
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="h-6 w-6" />
            <span className="font-heading font-semibold text-lg tracking-tight">Vercel</span>
          </div>
        </div>
      </div>
    </section>
  )
}
