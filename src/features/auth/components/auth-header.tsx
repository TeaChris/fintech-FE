import { cn } from "@/lib/utils";

import type { AuthHeaderProps } from "@/features/auth/types/auth.types";
import { LogoMark } from "@/features/auth/components/logo-mark";

export function AuthHeader({ headline, description, className }: AuthHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <LogoMark variant="light" />

      {headline ? (
        <div className="mt-6 flex flex-col gap-3">
          <h1 className="font-heading text-2xl font-semibold leading-tight tracking-tight xl:text-3xl">
            {headline}
          </h1>
          {description ? (
            <p className="max-w-[36ch] text-sm leading-relaxed opacity-50 xl:text-base">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
