'use client';

import { useEffect, useRef } from "react";
import Link from "next/link";
import { MailOpen, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVerifyEmail } from "@/features/auth/hooks";
import { ActionSuccessContent } from "./action-success-content";

export function VerifyEmailContent({ email, token }: { email?: string, token?: string }) {
      const { verifyEmail, isPending, success, error } = useVerifyEmail();
      const hasAttempted = useRef(false);

      useEffect(() => {
            if (token && !hasAttempted.current) {
                  hasAttempted.current = true;
                  verifyEmail({ token });
            }
      }, [token, verifyEmail]);

      if (token) {
            if (isPending) {
                  return (
                        <div className="flex flex-col items-center text-center gap-6" aria-label="Verifying email">
                              <div className="flex items-center justify-center size-16 rounded-full bg-accent/10 text-accent mb-2">
                                    <Loader2 className="size-8 animate-spin" />
                              </div>
                              <div className="space-y-2">
                                    <h3 className="text-[1.75rem] font-semibold leading-tight tracking-tight">Verifying Email</h3>
                                    <p className="text-[0.9375rem] text-muted-foreground leading-relaxed">
                                          Please wait while we verify your email address.
                                    </p>
                              </div>
                        </div>
                  );
            }

            if (success) {
                  return (
                        <ActionSuccessContent
                              title="Email Verified"
                              description="Your email has been successfully verified. You can now access all features of your account."
                              buttonText="Go to Dashboard"
                              buttonLink="/dashboard" // Adjust as needed
                        />
                  );
            }

            if (error) {
                  return (
                        <div className="flex flex-col items-center text-center gap-6" aria-label="Verification failed">
                              <div className="flex items-center justify-center size-16 rounded-full bg-destructive/10 text-destructive mb-2">
                                    <AlertCircle className="size-8" />
                              </div>
                              
                              <div className="space-y-2">
                                    <h3 className="text-[1.75rem] font-semibold leading-tight tracking-tight">Verification Failed</h3>
                                    <p className="text-[0.9375rem] text-muted-foreground leading-relaxed">
                                          {error || "The verification link is invalid or has expired."}
                                    </p>
                              </div>

                              <div className="w-full mt-4">
                                    <Button
                                          asChild
                                          size="lg"
                                          className="h-12 w-full rounded-xl bg-accent text-[0.9375rem] font-semibold text-accent-foreground transition-all hover:bg-accent/90 active:scale-[0.99]"
                                    >
                                          <Link href="/login">
                                                Return to Login
                                          </Link>
                                    </Button>
                              </div>
                        </div>
                  );
            }
      }

      // Default fallback when there is no token (the user just signed up)
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
