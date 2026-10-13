  "use client";

  import { usePathname, useRouter } from "next/navigation";
  import { useEffect } from "react";
  import { AppSidebar } from "@/components/layout/app-sidebar";
  import { AppTopbar } from "@/components/layout/app-topbar";
  import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
  import { Skeleton } from "@/components/ui/skeleton";
  import { useAppSelector } from "@/lib/hooks";
  import { ROUTES } from "@/lib/navigation";

  /**
   * Role-aware guard for the authenticated area. The session is restored from an
   * httpOnly cookie on load, so the first paint is unavoidably undecided and shows
   * a skeleton; the redirect waits for `unauthenticated`, which only a settled
   * restore can produce. This decides what to render only — every endpoint
   * re-checks the caller's permissions on the server.
   */
  export function DashboardShell({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const status = useAppSelector((state) => state.auth.status);
    const user = useAppSelector((state) => state.auth.user);

    useEffect(() => {
      if (status === "unauthenticated") {
        router.replace(`${ROUTES.login}?next=${encodeURIComponent(pathname)}`);
      }
    }, [status, pathname, router]);

    if (status !== "authenticated" || !user) {
      return <ShellSkeleton />;
    }

    return (
      <SidebarProvider>
        <AppSidebar user={user} />
        <SidebarInset>
          <AppTopbar role={user.role} />
          <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  function ShellSkeleton() {
    return (
      <div className="flex min-h-svh w-full" role="status">
        <span className="sr-only">Loading your workspace</span>
        <div className="hidden w-64 shrink-0 border-r border-sidebar-border p-3 md:block">
          <Skeleton className="h-9 w-full" />
          <div className="mt-6 space-y-2">
            {[0, 1, 2, 3].map((key) => (
              <Skeleton key={key} className="h-8 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-7 w-48" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((key) => (
              <Skeleton key={key} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="mt-6 h-64 w-full" />
        </div>
      </div>
    );
  }
