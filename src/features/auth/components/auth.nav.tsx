import { Globe } from "lucide-react";

import { LogoMark } from "@/features/auth/components/logo-mark";

function AuthNav() {
  return (
    <nav
      className="flex w-full items-center justify-between px-8 py-4 lg:px-20 lg:py-5"
      aria-label="Authentication navigation"
    >
      <LogoMark />

      {/* Language selector (decorative for now) */}
      <button
        type="button"
        className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        aria-label="Select language"
      >
        <Globe className="size-3.5 text-accent" aria-hidden="true" />
        <span>English</span>
        <svg
          className="size-3 opacity-50"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </nav>
  );
}

export { AuthNav };
