import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-6xl items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-md">
        <Card className="border-border/80 shadow-md">
          <CardHeader className="space-y-2 text-center pb-2">
            <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-xs">
              EC
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Sign in to EduCore
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Enter your academic email and password to access your workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <LoginForm />

            <div className="mt-6 flex flex-col items-center gap-2 border-t border-border pt-4 text-center text-sm text-muted-foreground">
              <div>
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Create an account
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
