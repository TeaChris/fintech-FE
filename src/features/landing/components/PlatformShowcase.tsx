import { Button } from '@/components'
import { Terminal, Code, Cpu } from 'lucide-react'

export function PlatformShowcase() {
  return (
    <section className="py-24 bg-muted/20 border-y border-border/50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Text Content */}
          <div className="max-w-xl">
            <h2 className="text-section-title mb-4">
              Designed for developers, loved by finance
            </h2>
            <p className="text-body text-muted-foreground mb-8">
              We&apos;ve abstracted the complexity of legacy banking infrastructure into elegant, composable APIs. Build a complete payment flow in hours, not months.
            </p>
            
            <ul className="space-y-6 mb-8">
              <li className="flex gap-4">
                <div className="flex-shrink-0 mt-1 w-8 h-8 rounded bg-background border border-border flex items-center justify-center">
                  <Code className="h-4 w-4 text-foreground" />
                </div>
                <div>
                  <h4 className="font-heading font-semibold text-base mb-1">RESTful Architecture</h4>
                  <p className="text-body-sm">Predictable resource-oriented URLs, form-encoded requests, and JSON responses.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 mt-1 w-8 h-8 rounded bg-background border border-border flex items-center justify-center">
                  <Terminal className="h-4 w-4 text-foreground" />
                </div>
                <div>
                  <h4 className="font-heading font-semibold text-base mb-1">Idempotent Requests</h4>
                  <p className="text-body-sm">Safely retry requests without the risk of accidentally double-charging customers.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 mt-1 w-8 h-8 rounded bg-background border border-border flex items-center justify-center">
                  <Cpu className="h-4 w-4 text-foreground" />
                </div>
                <div>
                  <h4 className="font-heading font-semibold text-base mb-1">Webhooks</h4>
                  <p className="text-body-sm">Receive real-time notifications about asynchronous events in your system.</p>
                </div>
              </li>
            </ul>
            
            <Button variant="outline" className="gap-2">
              Explore Documentation
            </Button>
          </div>

          {/* Abstracted Code/UI Mockup */}
          <div className="relative rounded-xl border border-border bg-card overflow-hidden shadow-sm lg:h-[500px]">
            <div className="flex items-center px-4 py-3 border-b border-border bg-muted/40">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-border"></div>
                <div className="w-3 h-3 rounded-full bg-border"></div>
                <div className="w-3 h-3 rounded-full bg-border"></div>
              </div>
              <div className="mx-auto text-caption">create_payment_intent.ts</div>
            </div>
            <div className="p-6 overflow-x-auto text-sm">
              <pre className="!bg-transparent !p-0 !m-0 !border-none text-muted-foreground font-mono leading-loose">
                <code>
<span className="text-accent">import</span> {'{ VaultPay }'} <span className="text-accent">from</span> &apos;vaultpay&apos;;
<br /><br />
<span className="text-accent">const</span> vault = <span className="text-accent">new</span> VaultPay(process.env.VAULTPAY_KEY);
<br /><br />
<span className="text-accent">export async function</span> createPayment() {'{'}
<br />
{'  '}<span className="text-accent">const</span> intent = <span className="text-accent">await</span> vault.paymentIntents.create({'{'}
<br />
{'    '}amount: <span className="text-foreground">2000</span>,
<br />
{'    '}currency: <span className="text-foreground">&apos;usd&apos;</span>,
<br />
{'    '}automatic_payment_methods: {'{'} enabled: <span className="text-foreground">true</span> {'}'},
<br />
{'    '}metadata: {'{'}
<br />
{'      '}order_id: <span className="text-foreground">&apos;ord_12345&apos;</span>
<br />
{'    }'}
<br />
{'  }'});
<br /><br />
{'  '}<span className="text-accent">return</span> intent.client_secret;
<br />
{'}'}
                </code>
              </pre>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  )
}
