"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

export function ResetPasswordForm() {
      const [showPassword, setShowPassword] = useState(false);
      const [showConfirmPassword, setShowConfirmPassword] = useState(false);

      return (
            <form className="flex flex-col gap-6" aria-label="Reset password form">
                  <FieldGroup className="gap-5">
                        <Field>
                              <FieldLabel htmlFor="reset-new-password">
                                    New password
                              </FieldLabel>
                              <div className="relative">
                                    <LockKeyhole
                                          className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground/50"
                                          aria-hidden="true"
                                    />
                                    <Input
                                          id="reset-new-password"
                                          type={
                                                showPassword
                                                      ? "text"
                                                      : "password"
                                          }
                                          placeholder="••••••••"
                                          autoComplete="new-password"
                                          className="h-11 rounded-xl pl-11 pr-11 text-[0.9375rem]"
                                          required
                                    />
                                    <button
                                          type="button"
                                          onClick={() =>
                                                setShowPassword((prev) => !prev)
                                          }
                                          className="absolute inset-y-0 right-0 flex items-center px-3.5 text-muted-foreground/60 transition-colors hover:text-foreground"
                                          aria-label={
                                                showPassword
                                                      ? "Hide password"
                                                      : "Show password"
                                          }
                                    >
                                          {showPassword ? (
                                                <EyeOff
                                                      className="size-4.5"
                                                      aria-hidden="true"
                                                />
                                          ) : (
                                                <Eye
                                                      className="size-4.5"
                                                      aria-hidden="true"
                                                />
                                          )}
                                    </button>
                              </div>
                              <ul className="text-xs text-muted-foreground mt-1 flex flex-col gap-1">
                                    <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> At least 12 characters</li>
                                    <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> One number</li>
                                    <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> One special character</li>
                              </ul>
                        </Field>

                        <Field>
                              <FieldLabel htmlFor="reset-confirm-password">
                                    Confirm new password
                              </FieldLabel>
                              <div className="relative">
                                    <LockKeyhole
                                          className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground/50"
                                          aria-hidden="true"
                                    />
                                    <Input
                                          id="reset-confirm-password"
                                          type={
                                                showConfirmPassword
                                                      ? "text"
                                                      : "password"
                                          }
                                          placeholder="••••••••"
                                          autoComplete="new-password"
                                          className="h-11 rounded-xl pl-11 pr-11 text-[0.9375rem]"
                                          required
                                    />
                                    <button
                                          type="button"
                                          onClick={() =>
                                                setShowConfirmPassword((prev) => !prev)
                                          }
                                          className="absolute inset-y-0 right-0 flex items-center px-3.5 text-muted-foreground/60 transition-colors hover:text-foreground"
                                          aria-label={
                                                showConfirmPassword
                                                      ? "Hide password"
                                                      : "Show password"
                                          }
                                    >
                                          {showConfirmPassword ? (
                                                <EyeOff
                                                      className="size-4.5"
                                                      aria-hidden="true"
                                                />
                                          ) : (
                                                <Eye
                                                      className="size-4.5"
                                                      aria-hidden="true"
                                                />
                                          )}
                                    </button>
                              </div>
                        </Field>
                  </FieldGroup>

                  <Button
                        type="submit"
                        size="lg"
                        className="h-12 w-full rounded-xl bg-accent text-[0.9375rem] font-semibold text-accent-foreground transition-all hover:bg-accent/90 active:scale-[0.99]"
                  >
                        Update password
                  </Button>
            </form>
      );
}
