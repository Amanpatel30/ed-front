"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { TextField } from "@/components/shared/form-fields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoginMutation } from "@/lib/api/authApi";
import { normalizeApiError } from "@/lib/api/error";
import { useAppSelector } from "@/lib/hooks";
import { HOME_ROUTE, safeNextPath } from "@/lib/navigation";
import { EMAIL_PATTERN } from "@/lib/validation";

interface FieldErrors {
  email?: string;
  password?: string;
}

export function LoginForm() {
  const router = useRouter();
  const status = useAppSelector((state) => state.auth.status);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [login, { isLoading, error }] = useLoginMutation();

  const apiError = normalizeApiError(error);

  // Covers both a successful sign-in and opening /login while already signed in.
  // The destination is read here rather than during render because `window` does
  // not exist while this component renders on the server.
  useEffect(() => {
    if (status === "authenticated") {
      router.replace(safeNextPath(window.location.search) ?? HOME_ROUTE);
    }
  }, [status, router]);

  // Restoration is still in flight, so the visitor is not yet known to be signed
  // out — and must not be shown the form that a signed-in visitor would never see.
  if (status === "initializing") return <FormPlaceholder />;

  // The redirect above is already running; rendering the form would flash it.
  if (status === "authenticated") return null;

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors: FieldErrors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errors.email = "Enter your email address.";
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      errors.email = "Enter a valid email address.";
    }

    if (!password) {
      errors.password = "Enter your password.";
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) return;

    try {
      await login({ email: trimmedEmail, password }).unwrap();
      // The auth status effect performs the redirect once the store updates.
    } catch {
      // Surfaced through the mutation's error state below.
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {apiError ? (
        <Alert variant="destructive" role="alert">
          <AlertTitle>Could not sign in</AlertTitle>
          <AlertDescription>{apiError.message}</AlertDescription>
        </Alert>
      ) : null}

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
        autoFocus
        placeholder="you@example.com"
      />

      <TextField
        id="password"
        label="Password"
        type="password"
        value={password}
        onValueChange={setPassword}
        error={fieldErrors.password}
        autoComplete="current-password"
        required
      />

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <LoaderCircle className="animate-spin" aria-hidden />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}

function FormPlaceholder() {
  return (
    <div className="space-y-5" role="status">
      <span className="sr-only">Checking your session</span>
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-9 w-full" />
    </div>
  );
}
