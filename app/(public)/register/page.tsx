import type { Metadata } from "next";
import Link from "next/link";

import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Create an account",
};

export default function RegisterPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-6xl items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-md">
        <Card className="border-border/80 shadow-md">
          <CardContent className="p-6 sm:p-8">
            <RegisterForm />

            <div className="mt-6 flex flex-col items-center gap-2 border-t border-border pt-4 text-center text-sm text-muted-foreground">
              <div>
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </div>
              <div>
                <Link
                  href="/"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Back to public home
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
