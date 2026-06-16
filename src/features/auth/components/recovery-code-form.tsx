"use client";

import Link from "next/link";
import { KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

export function RecoveryCodeForm() {
      return (
            <div className="flex flex-col items-center gap-7 mt-2" aria-label="Recovery code form">
                  <div className="flex items-center justify-center size-16 rounded-full bg-accent/10 text-accent mb-[-0.5rem]">
                        <KeyRound className="size-8" />
                  </div>
                  
                  <form className="flex flex-col gap-6 w-full">
                        <FieldGroup>
                              <Field>
                                    <FieldLabel htmlFor="recovery-code" className="sr-only">
                                          Recovery code
                                    </FieldLabel>
                                    <Input
                                          id="recovery-code"
                                          type="text"
                                          placeholder="XXXX-XXXX"
                                          autoComplete="off"
                                          className="h-12 rounded-xl text-center tracking-widest text-lg uppercase"
                                          required
                                    />
                              </Field>
                        </FieldGroup>

                        <Button
                              type="submit"
                              size="lg"
                              className="h-12 w-full rounded-xl bg-accent text-[0.9375rem] font-semibold text-accent-foreground transition-all hover:bg-accent/90 active:scale-[0.99]"
                        >
                              Continue
                        </Button>
                  </form>

                  <Link href="/sign-in" className="text-sm font-medium text-accent hover:underline underline-offset-4">
                        Back to sign in
                  </Link>
            </div>
      );
}
