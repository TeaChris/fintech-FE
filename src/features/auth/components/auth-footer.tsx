import { cn } from "@/lib/utils";

import type { AuthFooterProps } from "@/features/auth/types/auth.types";

const DEFAULT_FOOTER_LINKS = [
  { label: "Terms of Service", href: "/legal/terms" },
  { label: "Privacy Policy", href: "/legal/privacy" },
  { label: "Help", href: "/support" },
] as const;

export function AuthFooter({
  links,
  className,
  variant = "default",
}: AuthFooterProps) {
  const footerLinks = links ?? DEFAULT_FOOTER_LINKS;

  return (
    <footer
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1",
        className
      )}
    >
      {footerLinks.map((link, index) => (
        <a
          key={index}
          href={link.href}
          className={cn(
            "text-xs transition-colors",
            variant === "light"
              ? "opacity-40 hover:opacity-70"
              : "text-muted-foreground hover:text-foreground"
          )}
          target="_blank"
          rel="noopener noreferrer"
        >
          {link.label}
        </a>
      ))}
    </footer>
  );
}
