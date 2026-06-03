import { cn } from "@/lib/utils";

import type { AuthFooterProps } from "@/features/auth/types/auth.types";

/** Default legal links shown in the auth footer. */
const DEFAULT_FOOTER_LINKS = [
  { label: "Terms of Service", href: "/legal/terms" },
  { label: "Privacy Policy", href: "/legal/privacy" },
  { label: "Help", href: "/support" },
] as const;

/**
 * Auth page footer — subtle legal and support links.
 *
 * Intentionally de-emphasized with `text-xs` and `muted-foreground`
 * so it doesn't compete with the primary form content for attention.
 * Links default to Terms, Privacy, and Help but can be overridden.
 */
export function AuthFooter({ links, className }: AuthFooterProps) {
  const footerLinks = links ?? DEFAULT_FOOTER_LINKS;

  return (
    <footer
      className={cn(
        "flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-1 px-6 py-4 sm:px-8",
        className
      )}
    >
      {footerLinks.map((link, index) => (
        <a
          key={index}
          href={link.href}
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          target="_blank"
          rel="noopener noreferrer"
        >
          {link.label}
        </a>
      ))}
    </footer>
  );
}
