import Link from 'next/link'

import { cn } from '@/lib/utils'

interface LogoMarkProps {
      /** Additional className merged onto the link element. */
      className?: string
}

/**
 * Product logo / wordmark for auth pages.
 *
 * Uses the heading font (Geist) with primary color for a clean,
 * professional appearance. Replace the text content with an SVG
 * or image when brand assets are available.
 */
export function LogoMark({ className }: LogoMarkProps) {
      return (
            <Link
                  href="/"
                  aria-label="FinanceOS — Go to homepage"
                  className={cn(
                        'inline-flex items-center gap-2 text-foreground transition-opacity hover:opacity-80',
                        className,
                  )}
            >
                  <svg
                        width="28"
                        height="28"
                        viewBox="0 0 28 28"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                        className="shrink-0"
                  >
                        <rect
                              width="28"
                              height="28"
                              rx="8"
                              className="fill-primary"
                        />
                        <path
                              d="M8 10h12M8 14h8M8 18h10"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              className="text-primary-foreground"
                        />
                  </svg>
                  <span className="font-heading text-lg font-semibold tracking-tight">
                        BpaY
                  </span>
            </Link>
      )
}
