'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Eye, EyeOff, Mail, LockKeyhole, AlertCircle } from 'lucide-react'

import {
      Input,
      Field,
      Button,
      Checkbox,
      FieldGroup,
      FieldLabel,
} from '@/components'
import { useSignIn } from '../hooks/use-sign-in'

export function SignInForm() {
      const [showPassword, setShowPassword] = useState(false)
      const { signIn, isPending, error, fieldErrors } = useSignIn()

      const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)

            signIn({
                  email: formData.get('email') as string,
                  password: formData.get('password') as string,
            })
      }

      return (
            <form
                  className="flex flex-col gap-7"
                  aria-label="Sign in form"
                  onSubmit={handleSubmit}
            >
                  {error && (
                        <div className="flex items-center justify-center gap-3 rounded-xl bg-destructive/15 text-destructive">
                              <AlertCircle className="size-5 shrink-0" />
                              <p className="mt-4">{error}</p>
                        </div>
                  )}

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
                                          name="email"
                                          type="email"
                                          placeholder="name@company.com"
                                          autoComplete="email"
                                          className={`h-11 rounded-xl pl-11 text-[0.9375rem] ${fieldErrors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                          required
                                          disabled={isPending}
                                    />
                              </div>
                              {fieldErrors.email && (
                                    <p className="mt-1.5 text-xs font-medium text-destructive">
                                          {fieldErrors.email[0]}
                                    </p>
                              )}
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
                                          name="password"
                                          type={
                                                showPassword
                                                      ? 'text'
                                                      : 'password'
                                          }
                                          placeholder="••••••••"
                                          autoComplete="current-password"
                                          className={`h-11 rounded-xl pl-11 pr-11 text-[0.9375rem] ${fieldErrors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                          required
                                          disabled={isPending}
                                    />
                                    <button
                                          type="button"
                                          onClick={() =>
                                                setShowPassword((prev) => !prev)
                                          }
                                          className="absolute inset-y-0 right-0 flex items-center px-3.5 text-muted-foreground/60 transition-colors hover:text-foreground disabled:opacity-50"
                                          aria-label={
                                                showPassword
                                                      ? 'Hide password'
                                                      : 'Show password'
                                          }
                                          disabled={isPending}
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
                              {fieldErrors.password && (
                                    <p className="mt-1.5 text-xs font-medium text-destructive">
                                          {fieldErrors.password[0]}
                                    </p>
                              )}
                        </Field>
                  </FieldGroup>

                  <Field orientation="horizontal" className="gap-2.5">
                        <Checkbox
                              id="sign-in-remember"
                              name="remember"
                              disabled={isPending}
                        />
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
                        disabled={isPending}
                        className="h-12 w-full rounded-xl bg-accent text-[0.9375rem] font-semibold text-accent-foreground transition-all hover:bg-accent/90 active:scale-[0.99] disabled:opacity-70"
                  >
                        {isPending ? 'Signing in...' : 'Sign in'}
                  </Button>
            </form>
      )
}
