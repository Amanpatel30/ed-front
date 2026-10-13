import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 space-y-2 text-center">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Sign in to EduCore
          </h1>
          <p className="text-sm text-muted-foreground">
            Use the account your institution issued you.
          </p>
        </div>

        <LoginForm />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Back to home
          </Link>
        </p>

        <p className="mt-2 text-center text-sm text-muted-foreground">
          No account yet?{" "}
          <Link href="/register" className="hover:text-foreground">
            Create student account
          </Link>
        </p>
      </div>
    </div>
  );
}
