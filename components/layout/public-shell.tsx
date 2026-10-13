"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { useHydrated } from "@/hooks/use-hydrated";
import { useAppSelector } from "@/lib/hooks";
import { HOME_ROUTE, isPathWithin } from "@/lib/navigation";

/**
 * Public layout shell.
 *
 * Public visitor routes (home page /, /about, /contact, /login, /register)
 * are only accessible to unauthenticated visitors.
 *
 * If a user is logged in:
 * - Authenticated students can access /catalog to browse and enroll.
 * - Any other public route immediately redirects to /dashboard.
 */
export function PublicShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const status = useAppSelector((state) => state.auth.status);
  const user = useAppSelector((state) => state.auth.user);

  const isCatalog = isPathWithin(pathname, "/catalog");
  const isStudent = user?.role === "STUDENT";
  const isAllowedWhenAuthenticated = isCatalog && isStudent;

  const shouldRedirect =
    status === "authenticated" && !isAllowedWhenAuthenticated;

  useEffect(() => {
    if (shouldRedirect) {
      router.replace(HOME_ROUTE);
    }
  }, [shouldRedirect, router]);

  // If authenticated and visiting a visitor-only route, or still initializing
  // on a visitor-only route, defer rendering public markup and show a clean skeleton.
  if (hydrated && (shouldRedirect || (status === "initializing" && !isCatalog))) {
    return (
      <div
        className="flex min-h-svh w-full items-center justify-center bg-background p-8"
        role="status"
      >
        <span className="sr-only">Redirecting to your dashboard…</span>
        <div className="w-full max-w-sm space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
      <Toaster position="top-right" />
    </div>
  );
}

