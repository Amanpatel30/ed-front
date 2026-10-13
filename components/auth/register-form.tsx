"use client";

import { CircleCheck, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { TextField } from "@/components/shared/form-fields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { useRegisterMutation } from "@/lib/api/authApi";
import { normalizeApiError } from "@/lib/api/error";
import { EMAIL_PATTERN, MIN_PASSWORD_LENGTH } from "@/lib/validation";

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

/**
 * Public Student signup. The form asks for no role and no institution-issued
 * values (student code, admission date, department), because the API is the only
 * party that can decide them — see the `register` endpoint in `authApi`.
 */
export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [created, setCreated] = useState(false);

  const [register, { isLoading, error }] = useRegisterMutation();

  const apiError = normalizeApiError(error);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors: FieldErrors = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      errors.name = "Enter your full name.";
    }

    if (!trimmedEmail) {
      errors.email = "Enter your email address.";
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      errors.email = "Enter a valid email address.";
    }

    if (!password) {
      errors.password = "Choose a password.";
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Repeat your password.";
    } else if (confirmPassword !== password) {
      errors.confirmPassword = "The two passwords do not match.";
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) return;

    try {
      await register({
        name: trimmedName,
        email: trimmedEmail,
        password,
      }).unwrap();

      // Only reached once the API has confirmed the account.
      setCreated(true);
    } catch {
      // Reported through the mutation's error state above the form.
    }
  }

  if (created) {
    return (
      <div className="space-y-4 rounded-xl border border-border bg-card p-6 text-center">
        <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-accent">
          <CircleCheck className="size-5 text-accent-foreground" aria-hidden />
        </div>

        <div className="space-y-1">
          <p className="font-medium">Your student account was created</p>
          <p className="text-sm text-muted-foreground">
            Sign in as {email.trim()} to reach your workspace.
          </p>
        </div>

        <Link href="/login" className={buttonVariants()}>
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {apiError ? (
        <Alert variant="destructive" role="alert">
          <AlertTitle>Could not create your account</AlertTitle>
          <AlertDescription>{apiError.message}</AlertDescription>
        </Alert>
      ) : null}

      <TextField
        id="name"
        label="Full name"
        value={name}
        onValueChange={setName}
        error={fieldErrors.name}
        autoComplete="name"
        required
        autoFocus
        placeholder="Student One"
      />

      <TextField
        id="email"
        label="Email address"
        type="email"
        value={email}
        onValueChange={setEmail}
        error={fieldErrors.email}
        autoComplete="email"
        inputMode="email"
        required
        placeholder="you@example.com"
      />

      <TextField
        id="password"
        label="Password"
        type="password"
        value={password}
        onValueChange={setPassword}
        error={fieldErrors.password}
        hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
        autoComplete="new-password"
        required
      />

      <TextField
        id="confirmPassword"
        label="Confirm password"
        type="password"
        value={confirmPassword}
        onValueChange={setConfirmPassword}
        error={fieldErrors.confirmPassword}
        autoComplete="new-password"
        required
      />

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <LoaderCircle className="animate-spin" aria-hidden />
            Creating account…
          </>
        ) : (
          "Create account"
        )}
      </Button>
    </form>
  );
}
