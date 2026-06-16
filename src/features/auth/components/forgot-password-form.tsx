"use client";

import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

export function ForgotPasswordForm() {
      return (
            <form className="flex flex-col gap-7 mt-2" aria-label="Forgot password form">
                  <FieldGroup>
                        <Field>
                              <FieldLabel htmlFor="forgot-password-email">
                                    Email address
                              </FieldLabel>
                              <div className="relative">
                                    <Mail
                                          className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground/50"
                                          aria-hidden="true"
                                    />
                                    <Input
                                          id="forgot-password-email"
                                          type="email"
                                          placeholder="john@example.com"
                                          autoComplete="email"
                                          className="h-11 rounded-xl pl-11 text-[0.9375rem]"
                                          required
                                    />
                              </div>
                        </Field>
                  </FieldGroup>

                  <Button
                        type="submit"
                        size="lg"
                        className="h-12 w-full rounded-xl bg-accent text-[0.9375rem] font-semibold text-accent-foreground transition-all hover:bg-accent/90 active:scale-[0.99]"
                  >
                        Send reset link
                  </Button>
            </form>
      );
}
