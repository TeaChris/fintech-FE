import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { AuthCardProps } from "@/features/auth/types/auth.types";

/**
 * Standardized card container for auth forms.
 *
 * Wraps shadcn's Card primitives with consistent sizing, spacing,
 * and structure. The `children` slot receives the form content;
 * the `footer` slot is for alternate action links.
 *
 * @example
 * ```tsx
 * <AuthCard
 *   title="Sign in to your account"
 *   description="Enter your credentials below."
 *   footer={<p>Don't have an account? <Link href="/sign-up">Sign up</Link></p>}
 * >
 *   <SignInForm />
 * </AuthCard>
 * ```
 */
export function AuthCard({
  children,
  title,
  description,
  footer,
  className,
}: AuthCardProps) {
  return (
    <Card
      className={cn("w-full max-w-sm", className)}
    >
      <CardHeader>
        <CardTitle className="text-xl font-semibold tracking-tight">
          {title}
        </CardTitle>
        {description ? (
          <CardDescription>{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer ? (
        <CardFooter className="justify-center">
          <div className="text-sm text-muted-foreground">{footer}</div>
        </CardFooter>
      ) : null}
    </Card>
  );
}
