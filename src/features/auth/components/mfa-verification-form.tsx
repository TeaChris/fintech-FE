'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'

import {
      Field,
      Button,
      Checkbox,
      InputOTP,
      FieldLabel,
      InputOTPSlot,
      InputOTPGroup,
} from '@/components'

export function MfaVerificationForm() {
      return (
            <div
                  className="flex flex-col items-center gap-7 mt-2"
                  aria-label="MFA verification form"
            >
                  <div className="flex items-center justify-center size-16 rounded-full bg-accent/10 text-accent -mb-2">
                        <Lock className="size-8" />
                  </div>

                  <form className="flex flex-col gap-6 w-full items-center">
                        <InputOTP maxLength={6}>
                              <InputOTPGroup className="gap-2 sm:gap-3 flex justify-center">
                                    <InputOTPSlot
                                          index={0}
                                          className="size-11 sm:size-12 rounded-lg border text-lg"
                                    />
                                    <InputOTPSlot
                                          index={1}
                                          className="size-11 sm:size-12 rounded-lg border text-lg"
                                    />
                                    <InputOTPSlot
                                          index={2}
                                          className="size-11 sm:size-12 rounded-lg border text-lg"
                                    />
                                    <InputOTPSlot
                                          index={3}
                                          className="size-11 sm:size-12 rounded-lg border text-lg"
                                    />
                                    <InputOTPSlot
                                          index={4}
                                          className="size-11 sm:size-12 rounded-lg border text-lg"
                                    />
                                    <InputOTPSlot
                                          index={5}
                                          className="size-11 sm:size-12 rounded-lg border text-lg"
                                    />
                              </InputOTPGroup>
                        </InputOTP>

                        <Field
                              orientation="horizontal"
                              className="gap-2.5 items-center w-full justify-center"
                        >
                              <Checkbox id="mfa-remember" />
                              <FieldLabel
                                    htmlFor="mfa-remember"
                                    className="cursor-pointer font-normal text-muted-foreground"
                              >
                                    Remember this device for 30 days
                              </FieldLabel>
                        </Field>

                        <Button
                              type="submit"
                              size="lg"
                              className="h-12 w-full rounded-xl bg-accent text-[0.9375rem] font-semibold text-accent-foreground transition-all hover:bg-accent/90 active:scale-[0.99]"
                        >
                              Verify
                        </Button>
                  </form>

                  <Link
                        href="/recovery"
                        className="text-sm font-medium text-accent hover:underline underline-offset-4"
                  >
                        Use a recovery code
                  </Link>
            </div>
      )
}
