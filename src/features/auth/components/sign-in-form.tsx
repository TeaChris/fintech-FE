"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";

export function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="sign-in-email">Email address</FieldLabel>
          <Input
            id="sign-in-email"
            type="email"
            placeholder="name@company.com"
            autoComplete="email"
            required
          />
        </Field>

        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="sign-in-password">Password</FieldLabel>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="sign-in-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              className="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </Field>
      </FieldGroup>

      <Field orientation="horizontal" className="gap-2">
        <Checkbox id="sign-in-remember" />
        <FieldLabel
          htmlFor="sign-in-remember"
          className="cursor-pointer font-normal text-muted-foreground"
        >
          Remember me
        </FieldLabel>
      </Field>

      <div className="flex flex-col gap-3">
        <Button type="submit" size="lg" className="h-10 w-full">
          Sign in
        </Button>

        <FieldSeparator>or</FieldSeparator>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-10 w-full"
        >
          Continue with SSO
        </Button>
      </div>
    </form>
  );
}
