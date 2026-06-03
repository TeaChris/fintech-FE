import { Lock, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

import type { TrustIndicatorsProps } from "@/features/auth/types/auth.types";

/** Security signals displayed on auth pages. */
const TRUST_SIGNALS = [
  {
    icon: Lock,
    label: "256-bit encryption",
  },
  {
    icon: ShieldCheck,
    label: "SOC 2 compliant",
  },
] as const;

/**
 * Subtle trust indicators for auth pages.
 *
 * Displays small icon + text pairs communicating security posture.
 * Intentionally non-intrusive — uses `text-xs` and `muted-foreground`.
 * Positioned between the main content and the footer.
 */
export function TrustIndicators({ className }: TrustIndicatorsProps) {
  return (
    <div
      aria-label="Security information"
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-5 gap-y-1 px-6 py-2",
        className
      )}
    >
      {TRUST_SIGNALS.map((signal) => (
        <div
          key={signal.label}
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <signal.icon className="size-3.5 shrink-0" aria-hidden="true" />
          <span>{signal.label}</span>
        </div>
      ))}
    </div>
  );
}
