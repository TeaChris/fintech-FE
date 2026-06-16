import Link from "next/link";
import { MailOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VerifyEmailContent({ email }: { email?: string }) {
      return (
            <div className="flex flex-col items-center text-center gap-6" aria-label="Verify email content">
                  <div className="flex items-center justify-center size-16 rounded-full bg-accent/10 text-accent mb-2">
                        <MailOpen className="size-8" />
                  </div>
                  
                  <div className="space-y-2">
                        <p className="text-[0.9375rem] text-muted-foreground leading-relaxed">
                              We&apos;ve sent a verification link to<br/>
                              <strong className="text-foreground font-medium">{email ?? "your email"}</strong>
                        </p>
                        <p className="text-[0.9375rem] text-muted-foreground leading-relaxed">
                              Click the link in the email to verify<br/>
                              your account and get started.
                        </p>
                  </div>

                  <div className="w-full space-y-4 mt-2">
                        <Button
                              asChild
                              size="lg"
                              className="h-12 w-full rounded-xl bg-accent text-[0.9375rem] font-semibold text-accent-foreground transition-all hover:bg-accent/90 active:scale-[0.99]"
                        >
                              <Link href="https://mail.google.com" target="_blank" rel="noopener noreferrer">
                                    Open Gmail
                              </Link>
                        </Button>
                        
                        <div className="flex flex-col gap-2 text-sm">
                              <span className="text-muted-foreground">Didn&apos;t receive the email?</span>
                              <div className="flex items-center justify-center gap-4">
                                    <button type="button" className="font-medium text-accent hover:underline underline-offset-4">Resend email</button>
                                    <button type="button" className="font-medium text-accent hover:underline underline-offset-4">Change email</button>
                              </div>
                        </div>
                  </div>
            </div>
      );
}
