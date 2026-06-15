import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActionSuccessContentProps {
      title: string;
      description: string;
      buttonText: string;
      buttonLink: string;
}

export function ActionSuccessContent({ title, description, buttonText, buttonLink }: ActionSuccessContentProps) {
      return (
            <div className="flex flex-col items-center text-center gap-6" aria-label={title}>
                  <div className="flex items-center justify-center size-16 rounded-full bg-emerald-50 text-emerald-500 mb-2">
                        <CheckCircle2 className="size-8" />
                  </div>
                  
                  <div className="space-y-2">
                        <h3 className="text-[1.75rem] font-semibold leading-tight tracking-tight">{title}</h3>
                        <p className="text-[0.9375rem] text-muted-foreground leading-relaxed max-w-[260px]">
                              {description}
                        </p>
                  </div>

                  <div className="w-full mt-4">
                        <Button
                              asChild
                              size="lg"
                              className="h-12 w-full rounded-xl bg-accent text-[0.9375rem] font-semibold text-accent-foreground transition-all hover:bg-accent/90 active:scale-[0.99]"
                        >
                              <Link href={buttonLink}>
                                    {buttonText}
                              </Link>
                        </Button>
                  </div>
            </div>
      );
}
