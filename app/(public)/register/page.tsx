import type { Metadata } from "next";
import Link from "next/link";

import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create a student account",
};

export default function RegisterPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 space-y-2 text-center">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Create a student account
          </h1>
          <p className="text-sm text-muted-foreground">
            This form creates a Student account. Staff accounts are issued by the
            institution.
          </p>
        </div>

        <RegisterForm />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="hover:text-foreground">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
