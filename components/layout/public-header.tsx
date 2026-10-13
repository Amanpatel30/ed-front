"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydrated } from "@/hooks/use-hydrated";
import { useAppSelector } from "@/lib/hooks";
import { HOME_ROUTE, isPathWithin } from "@/lib/navigation";
import { ROLE_LABELS } from "@/lib/roles";
import { cn } from "cn";

/**
 * Site-level navigation, distinct from the role-aware workspace menu in
 * `lib/navigation.ts`. Every target below exists. `/catalog` is the public
 * catalogue: an anonymous visitor can browse courses without signing in.
 *
 * There is deliberately no sign-in or register item — those URLs stay reachable
 * without being advertised here.
 */
const PUBLIC_NAV = [
  { title: "Courses", href: "/catalog" },
  { title: "About", href: "/about" },
  { title: "Contact", href: "/contact" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Read only for the mobile menu, whose popup is mounted on open — after
  // hydration — so it is never part of the server render.
  const user = useAppSelector((state) => state.auth.user);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href={user ? HOME_ROUTE : "/"}
          className="flex items-center gap-2 font-heading font-semibold tracking-tight"
        >
          <span
            aria-hidden
            className="grid size-7 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground"
          >
            EC
          </span>
          EduCore
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {PUBLIC_NAV.map((item) => {
            const current = isPathWithin(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-muted hover:text-foreground",
                  current ? "font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                {item.title}
              </Link>
            );
          })}
        </nav>

        {/* A fixed pair of slots: the account area first, the menu trigger last.
            Neither moves when the session resolves, so the navigation above
            cannot be displaced by a change in authentication state. */}
        <div className="flex items-center gap-2">
          <AccountSection />

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              render={<Button variant="ghost" size="icon-sm" className="md:hidden" />}
            >
              <Menu />
              <span className="sr-only">Open menu</span>
            </SheetTrigger>

            <SheetContent side="right" className="w-64 gap-0 p-0">
              <SheetHeader className="border-b border-border">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>

              <nav aria-label="Main" className="flex flex-col p-2">
                {PUBLIC_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-muted",
                      isPathWithin(pathname, item.href)
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {item.title}
                  </Link>
                ))}
              </nav>

              {user ? (
                <div className="mt-auto space-y-3 border-t border-border p-4">
                  <p className="text-sm text-muted-foreground">
                    {user.name} · {ROLE_LABELS[user.role]}
                  </p>

                  <Link
                    href={HOME_ROUTE}
                    onClick={() => setMenuOpen(false)}
                    className={cn(buttonVariants({ size: "sm" }), "w-full")}
                  >
                    Open dashboard
                  </Link>
                </div>
              ) : null}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

/**
 * The header's only authentication-dependent markup.
 *
 * The tab's session is unknowable while the page is being rendered on the server,
 * and react-redux reads the live store when hydrating, so this holds the skeleton
 * — its server-rendered shape — until `useHydrated` says the first render is
 * behind us. Only then is the session read.
 *
 * An anonymous visitor gets no sign-in or register control, by design; `/login`
 * and `/register` stay reachable by URL.
 */
function AccountSection() {
  const hydrated = useHydrated();
  const status = useAppSelector((state) => state.auth.status);
  const user = useAppSelector((state) => state.auth.user);

  if (!hydrated || status === "initializing") {
    return <Skeleton className="h-8 w-24" />;
  }

  if (!user) return null;

  return (
    <>
      <span className="hidden text-sm text-muted-foreground sm:inline">
        {user.name} · {ROLE_LABELS[user.role]}
      </span>

      <Link href={HOME_ROUTE} className={buttonVariants({ size: "sm" })}>
        Open dashboard
      </Link>
    </>
  );
}
