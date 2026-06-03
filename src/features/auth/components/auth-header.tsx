import { cn } from "@/lib/utils";

import type { AuthHeaderProps } from "@/features/auth/types/auth.types";
import { LogoMark } from "@/features/auth/components/logo-mark";

/**
 * Auth page header — logo on the left, optional action on the right.
 *
 * Renders as a semantic `<header>` with consistent height and padding
 * across all auth routes. The `action` slot is commonly used for a link
 * to the alternate auth page (e.g., "Sign up" on the sign-in page).
 */
export function AuthHeader({ action }: AuthHeaderProps) {
  return (
    <header
      className={cn(
        "flex w-full items-center justify-between px-6 py-4",
        "sm:px-8"
      )}
    >
      <LogoMark />
      {action ? (
        <div className="flex items-center gap-2 text-sm">{action}</div>
      ) : null}
    </header>
  );
}
