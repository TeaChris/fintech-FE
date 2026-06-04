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

export function AuthCard({
  children,
  title,
  description,
  footer,
  className,
}: AuthCardProps) {
  return (
    <Card
      className={cn("w-full max-w-md rounded-2xl py-6 shadow-sm", className)}
    >
      <CardHeader className="px-6">
        <CardTitle className="font-heading text-2xl font-semibold tracking-tight">
          {title}
        </CardTitle>
        {description ? (
          <CardDescription className="text-sm">{description}</CardDescription>
        ) : null}
      </CardHeader>

      <CardContent className="px-6">{children}</CardContent>

      {footer ? (
        <CardFooter className="justify-center border-none bg-transparent px-6">
          <div className="text-sm text-muted-foreground">{footer}</div>
        </CardFooter>
      ) : null}
    </Card>
  );
}
