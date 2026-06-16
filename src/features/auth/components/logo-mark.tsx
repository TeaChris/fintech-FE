import Link from "next/link";

import { cn } from "@/lib/utils";

import type { LogoMarkProps } from "@/features/auth/types/auth.types";

export function LogoMark({ className, variant = "default" }: LogoMarkProps) {
  return (
    <Link
      href="/"
      aria-label="BpaY — Go to homepage"
      className={cn(
        "inline-flex items-center gap-2.5 transition-opacity hover:opacity-80",
        variant === "default" && "text-foreground",
        className
      )}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          width="32"
          height="32"
          rx="8"
          className="fill-accent"
        />
        <path
          d="M10 11h12M10 16h8M10 21h10"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeOpacity="0.9"
        />
      </svg>
      <span className="font-heading text-xl font-bold tracking-tight">
        BpaY
      </span>
    </Link>
  );
}
