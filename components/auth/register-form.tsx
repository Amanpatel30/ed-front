"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { TextField } from "@/components/shared/form-fields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useLoginMutation, useRegisterMutation } from "@/lib/api/authApi";
import { normalizeApiError } from "@/lib/api/error";
import { HOME_ROUTE } from "@/lib/navigation";
import { EMAIL_PATTERN, MIN_PASSWORD_LENGTH } from "@/lib/validation";

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

/**
 * Public Student signup.
 * Upon successful registration, displays a toast message, automatically
 * signs the new user in, and redirects directly to the dashboard.
 */
export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [register, { isLoading: isRegistering, error: registerError }] =
    useRegisterMutation();
  const [login, { isLoading: isLoggingIn, error: loginError }] =
    useLoginMutation();

  const isPending = isRegistering || isLoggingIn;
  const apiError = normalizeApiError(registerError || loginError);

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

      toast.success("Account created successfully! Welcome to EduCore.");

      // Automatically sign in the user and redirect to dashboard
      await login({
        email: trimmedEmail,
        password,
      }).unwrap();

      router.replace(HOME_ROUTE);
    } catch (err) {
      const normalized = normalizeApiError(err);
      if (normalized?.message) {
        toast.error(normalized.message);
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Create an account
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your details to get started with EduCore.
        </p>
      </div>

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
          placeholder="Alex Morgan"
          disabled={isPending}
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
          disabled={isPending}
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
          disabled={isPending}
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
          disabled={isPending}
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <LoaderCircle className="animate-spin" aria-hidden />
              {isLoggingIn ? "Signing you in…" : "Creating account…"}
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </div>
  );
}
