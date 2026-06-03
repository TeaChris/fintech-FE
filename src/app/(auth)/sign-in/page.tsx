import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";

import { AuthCard } from "@/features/auth";

export const metadata: Metadata = {
  title: "Sign In — FinanceOS",
  description:
    "Sign in to your FinanceOS account to manage your finances securely.",
};

/**
 * Sign In page — example of using the auth layout system.
 *
 * This page demonstrates the recommended pattern for building auth pages:
 * 1. Use `AuthCard` for the card container (title, description, footer)
 * 2. Use `FieldGroup` + `Field` for form layout (per shadcn rules)
 * 3. Use shadcn primitives exclusively — no custom input/button markup
 *
 * The form is structured for react-hook-form + zod integration but does
 * not implement actual form logic. This is the layout architecture only.
 */
export default function SignInPage() {
  return (
    <AuthCard
      title="Sign in to your account"
      description="Enter your credentials to access your account."
      footer={
        <p>
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
          >
            Sign up
          </Link>
        </p>
      }
    >
      <form className="flex flex-col gap-6">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              autoComplete="email"
              required
            />
          </Field>

          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </Field>
        </FieldGroup>

        <Button type="submit" size="lg" className="w-full">
          Sign in
        </Button>

        <FieldSeparator>or</FieldSeparator>

        <Button type="button" variant="outline" size="lg" className="w-full">
          Continue with SSO
        </Button>
      </form>
    </AuthCard>
  );
}
