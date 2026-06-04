"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Mail, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

export function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form className="flex flex-col gap-7" aria-label="Sign in form">
      <FieldGroup className="gap-5">
        <Field>
          <FieldLabel htmlFor="sign-in-email">Email address</FieldLabel>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground/50"
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
            <FieldLabel htmlFor="sign-in-password">Password</FieldLabel>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-accent underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <LockKeyhole
              className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground/50"
              aria-hidden="true"
            />
            <Input
              id="sign-in-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              className="h-11 rounded-xl pl-11 pr-11 text-[0.9375rem]"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex items-center px-3.5 text-muted-foreground/60 transition-colors hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-[18px]" aria-hidden="true" />
              ) : (
                <Eye className="size-[18px]" aria-hidden="true" />
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
    </form>
  );
}
