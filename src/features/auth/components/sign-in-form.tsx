'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Mail, LockKeyhole } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'

export function SignInForm() {
      const [showPassword, setShowPassword] = useState(false)

      return (
            <form className="flex flex-col gap-7" aria-label="Sign in form">
                  <FieldGroup className="gap-5">
                        <Field>
                              <FieldLabel htmlFor="sign-in-email">
                                    Email address
                              </FieldLabel>
                              <div className="relative">
                                    <Mail
                                          className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground/50"
                                          aria-hidden="true"
                                    />
                                    <Input
                                          id="sign-in-email"
                                          type="email"
                                          placeholder="name@company.com"
                                          autoComplete="email"
                                          className="h-11 rounded-xl pl-11 text-[0.9375rem]"
                                          required
                                    />
                              </div>
                        </Field>

                        <Field>
                              <div className="flex items-center justify-between">
                                    <FieldLabel htmlFor="sign-in-password">
                                          Password
                                    </FieldLabel>
                                    <Link
                                          href="/forgot-password"
                                          className="text-xs font-medium text-accent underline-offset-4 transition-colors hover:text-foreground hover:underline"
                                    >
                                          Forgot password?
                                    </Link>
                              </div>
                              <div className="relative">
                                    <LockKeyhole
                                          className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground/50"
                                          aria-hidden="true"
                                    />
                                    <Input
                                          id="sign-in-password"
                                          type={
                                                showPassword
                                                      ? 'text'
                                                      : 'password'
                                          }
                                          placeholder="••••••••"
                                          autoComplete="current-password"
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
                                                      ? 'Hide password'
                                                      : 'Show password'
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
                        </Field>
                  </FieldGroup>

                  <Field orientation="horizontal" className="gap-2.5">
                        <Checkbox id="sign-in-remember" />
                        <FieldLabel
                              htmlFor="sign-in-remember"
                              className="cursor-pointer font-normal text-muted-foreground"
                        >
                              Remember me
                        </FieldLabel>
                  </Field>

                  <Button
                        type="submit"
                        size="lg"
                        className="h-12 w-full rounded-xl bg-accent text-[0.9375rem] font-semibold text-accent-foreground transition-all hover:bg-accent/90 active:scale-[0.99]"
                  >
                        Sign in
                  </Button>

                  {/* <div className="relative my-1">
                        <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t border-muted" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-card px-2 text-muted-foreground">or</span>
                        </div>
                  </div>

                  <div className="flex flex-col gap-3">
                        <Button variant="outline" type="button" className="h-11 rounded-xl text-[0.9375rem] font-medium w-full">
                              <svg className="mr-2 size-4" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                              </svg>
                              Continue with Google
                        </Button>
                        <Button variant="outline" type="button" className="h-11 rounded-xl text-[0.9375rem] font-medium w-full">
                              <svg className="mr-2 size-4" viewBox="0 0 21 21">
                                    <path fill="#f25022" d="M1 1h9v9H1z" />
                                    <path fill="#00a4ef" d="M1 11h9v9H1z" />
                                    <path fill="#7fba00" d="M11 1h9v9h-9z" />
                                    <path fill="#ffb900" d="M11 11h9v9h-9z" />
                              </svg>
                              Continue with Microsoft
                        </Button>
                  </div> */}
            </form>
      )
}
