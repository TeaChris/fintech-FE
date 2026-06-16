'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
      Eye,
      Mail,
      EyeOff,
      UserRound,
      LockKeyhole,
      AlertCircle,
} from 'lucide-react'

import {
      Field,
      Input,
      Button,
      Checkbox,
      FieldGroup,
      FieldLabel,
} from '@/components'

import { useSignUp } from '../hooks/use-sign-up'

export function SignUpForm() {
      const [showPassword, setShowPassword] = useState(false)
      const [showConfirmPassword, setShowConfirmPassword] = useState(false)
      const { signUp, isPending, error, fieldErrors, setError } = useSignUp()

      const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)

            const password = formData.get('password') as string
            const confirmPassword = formData.get('confirmPassword') as string

            if (password !== confirmPassword) {
                  setError('Passwords do not match')
                  return
            }

            signUp({
                  displayName: formData.get('displayName') as string,
                  email: formData.get('email') as string,
                  password: password,
            })
      }

      return (
            <form
                  className="flex flex-col gap-6"
                  aria-label="Sign up form"
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
                              <FieldLabel htmlFor="sign-up-name">
                                    Full name
                              </FieldLabel>
                              <div className="relative">
                                    <UserRound
                                          className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground/50"
                                          aria-hidden="true"
                                    />
                                    <Input
                                          id="sign-up-name"
                                          name="displayName"
                                          type="text"
                                          placeholder="John Doe"
                                          autoComplete="name"
                                          className={`h-11 rounded-xl pl-11 text-[0.9375rem] ${fieldErrors.displayName ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                          required
                                          disabled={isPending}
                                    />
                              </div>
                              {fieldErrors.displayName && (
                                    <p className="mt-1.5 text-xs font-medium text-destructive">
                                          {fieldErrors.displayName[0]}
                                    </p>
                              )}
                        </Field>

                        <Field>
                              <FieldLabel htmlFor="sign-up-email">
                                    Email address
                              </FieldLabel>
                              <div className="relative">
                                    <Mail
                                          className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground/50"
                                          aria-hidden="true"
                                    />
                                    <Input
                                          id="sign-up-email"
                                          name="email"
                                          type="email"
                                          placeholder="john@example.com"
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
                              <FieldLabel htmlFor="sign-up-password">
                                    Password
                              </FieldLabel>
                              <div className="relative">
                                    <LockKeyhole
                                          className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground/50"
                                          aria-hidden="true"
                                    />
                                    <Input
                                          id="sign-up-password"
                                          name="password"
                                          type={
                                                showPassword
                                                      ? 'text'
                                                      : 'password'
                                          }
                                          placeholder="••••••••"
                                          autoComplete="new-password"
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
                              <ul className="text-xs text-muted-foreground mt-1 flex flex-col gap-1">
                                    <li className="flex items-center gap-2">
                                          <span className="text-emerald-500">
                                                ✓
                                          </span>{' '}
                                          At least 8 characters
                                    </li>
                              </ul>
                        </Field>

                        <Field>
                              <FieldLabel htmlFor="sign-up-confirm-password">
                                    Confirm password
                              </FieldLabel>
                              <div className="relative">
                                    <LockKeyhole
                                          className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground/50"
                                          aria-hidden="true"
                                    />
                                    <Input
                                          id="sign-up-confirm-password"
                                          name="confirmPassword"
                                          type={
                                                showConfirmPassword
                                                      ? 'text'
                                                      : 'password'
                                          }
                                          placeholder="••••••••"
                                          autoComplete="new-password"
                                          className="h-11 rounded-xl pl-11 pr-11 text-[0.9375rem]"
                                          required
                                          disabled={isPending}
                                    />
                                    <button
                                          type="button"
                                          onClick={() =>
                                                setShowConfirmPassword(
                                                      (prev) => !prev,
                                                )
                                          }
                                          className="absolute inset-y-0 right-0 flex items-center px-3.5 text-muted-foreground/60 transition-colors hover:text-foreground disabled:opacity-50"
                                          aria-label={
                                                showConfirmPassword
                                                      ? 'Hide password'
                                                      : 'Show password'
                                          }
                                          disabled={isPending}
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

                  <Field
                        orientation="horizontal"
                        className="gap-2.5 items-start mt-1"
                  >
                        <Checkbox
                              id="sign-up-terms"
                              required
                              disabled={isPending}
                              className="mt-0.5"
                        />
                        <FieldLabel
                              htmlFor="sign-up-terms"
                              className="cursor-pointer font-normal text-muted-foreground text-xs leading-relaxed"
                        >
                              I agree to the{' '}
                              <Link
                                    href="/terms"
                                    className="text-accent hover:underline"
                              >
                                    Terms of Service
                              </Link>{' '}
                              and{' '}
                              <Link
                                    href="/privacy"
                                    className="text-accent hover:underline"
                              >
                                    Privacy Policy
                              </Link>
                        </FieldLabel>
                  </Field>

                  <Button
                        type="submit"
                        size="lg"
                        disabled={isPending}
                        className="h-12 w-full rounded-xl bg-accent text-[0.9375rem] font-semibold text-accent-foreground transition-all hover:bg-accent/90 active:scale-[0.99] disabled:opacity-70"
                  >
                        {isPending ? 'Creating account...' : 'Create account'}
                  </Button>
            </form>
      )
}
