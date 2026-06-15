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
                  className={cn(
                        "w-full mx-auto sm:max-w-112.5 rounded-2xl py-10 shadow-[0_1px_3px_0_rgba(0,0,0,0.04),0_6px_24px_-2px_rgba(0,0,0,0.06)]",
                        className,
                  )}
            >
                  <CardHeader className="gap-2 px-10">
                        <CardTitle className="font-heading text-[1.75rem] font-semibold leading-tight tracking-tight">
                              {title}
                        </CardTitle>
                        {description ? (
                              <CardDescription className="text-[0.9375rem] leading-relaxed">
                                    {description}
                              </CardDescription>
                        ) : null}
                  </CardHeader>

                  <CardContent className="px-10 pt-2">{children}</CardContent>

                  {footer ? (
                        <CardFooter className="justify-center border-none bg-transparent px-10 pt-2">
                              <div className="text-sm text-muted-foreground">
                                    {footer}
                              </div>
                        </CardFooter>
                  ) : null}
            </Card>
      );
}
