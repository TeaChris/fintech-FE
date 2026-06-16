import Link from "next/link";
import { Lock } from "lucide-react";

export function AccountLockedContent() {
      return (
            <div className="flex flex-col items-center text-center gap-6" aria-label="Account locked">
                  <div className="flex items-center justify-center size-16 rounded-full bg-red-50 text-red-500 mb-2">
                        <Lock className="size-8" />
                  </div>
                  
                  <div className="space-y-2">
                        <p className="text-[0.9375rem] text-muted-foreground leading-relaxed">
                              Too many unsuccessful login<br/>attempts.
                        </p>
                        <p className="text-[0.9375rem] text-muted-foreground leading-relaxed mt-4">
                              For your security, your account is<br/>temporarily locked.
                        </p>
                  </div>

                  <div className="w-full space-y-4 mt-4">
                        <div className="h-12 w-full rounded-xl bg-red-50 text-[0.9375rem] font-medium text-red-600 flex items-center justify-center">
                              Try again in 15 minutes.
                        </div>
                        
                        <div className="flex justify-center pt-2">
                              <Link href="/support" className="text-sm font-medium text-accent hover:underline underline-offset-4">
                                    Contact support
                              </Link>
                        </div>
                  </div>
            </div>
      );
}
