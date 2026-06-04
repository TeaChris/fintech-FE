import { Activity, BadgeCheck, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

import type { TrustIndicatorsProps } from "@/features/auth/types/auth.types";

const TRUST_SIGNALS = [
  { icon: ShieldCheck, label: "Bank-grade security" },
  { icon: BadgeCheck, label: "SOC 2 compliant" },
  { icon: Activity, label: "Continuous monitoring" },
] as const;

export function TrustIndicators({ className }: TrustIndicatorsProps) {
  return (
    <ul
      aria-label="Security information"
      className={cn("flex flex-col gap-3", className)}
    >
      {TRUST_SIGNALS.map((signal) => (
        <li
          key={signal.label}
          className="flex items-center gap-2.5 text-sm"
        >
          <signal.icon
            className="size-4 shrink-0 opacity-50"
            aria-hidden="true"
          />
          <span className="opacity-60">{signal.label}</span>
        </li>
      ))}
    </ul>
  );
}
