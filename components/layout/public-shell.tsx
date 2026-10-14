"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { useHydrated } from "@/hooks/use-hydrated";
import { tabHasSession } from "@/lib/features/auth/tab-context";
import { useAppSelector } from "@/lib/hooks";
import { HOME_ROUTE, isPathWithin } from "@/lib/navigation";

/**
 * Public layout shell.
 *
 * Public visitor routes (home page /, /about, /contact, /login, /register, /catalog)
 * are only accessible to unauthenticated visitors.
 *
 * If a user is logged in, they should not see the home page or public routes;
 * they are immediately redirected to their authenticated workspace:
 * - Students visiting /catalog are redirected to /dashboard/catalog.
 * - Administrators visiting /catalog are redirected to /courses.
 * - Any other public route immediately redirects to /dashboard.
 */
export function PublicShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const status = useAppSelector((state) => state.auth.status);
  const user = useAppSelector((state) => state.auth.user);

  const isAuthRoute =
    isPathWithin(pathname, "/login") || isPathWithin(pathname, "/register");

  const hasSession = tabHasSession();
  const isAuthenticated = status === "authenticated";
  const isRestoring = status === "initializing" && hasSession;
  const isPendingAuthRoute = status === "initializing" && isAuthRoute;

  // Logged-in users should not see the home page or public routes
  const shouldRedirect = isAuthenticated;

  const targetPath =
    pathname === "/catalog" && user?.role === "STUDENT"
      ? "/dashboard/catalog"
      : pathname === "/catalog" &&
          (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN")
        ? "/courses"
        : HOME_ROUTE;

  useEffect(() => {
    if (shouldRedirect) {
      router.replace(targetPath);
    }
  }, [shouldRedirect, targetPath, router]);

  // If authenticated or restoring an existing session, defer rendering public markup and show a clean skeleton.
  if (hydrated && (shouldRedirect || isRestoring || isPendingAuthRoute)) {
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
