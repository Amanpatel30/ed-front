"use client";

import { LogOut, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeModeToggle } from "@/components/themes/theme-mode-toggle";
import { useLogoutMutation } from "@/lib/api/authApi";
import { breadcrumbsFor } from "@/lib/navigation";
import { ROLE_LABELS } from "@/lib/roles";
import type { RoleName } from "@/lib/types";

export function AppTopbar({ role }: { role: RoleName }) {
  const pathname = usePathname();
  const crumbs = breadcrumbsFor(pathname, role);
  const [logout, { isLoading }] = useLogoutMutation();

  return (
    <header className="bg-background/60 sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border backdrop-blur-md md:h-14">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4 data-vertical:self-center" />

        <Breadcrumb>
          <BreadcrumbList>
            {crumbs.map((crumb, index) => {
              const isLast = index === crumbs.length - 1;
              return (
                <span key={`${crumb.title}-${index}`} className="contents">
                  <BreadcrumbItem>
                    {isLast || !crumb.href ? (
                      <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink render={<Link href={crumb.href} />}>
                        {crumb.title}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {isLast ? null : <BreadcrumbSeparator />}
                </span>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-2 px-4">
        <Badge variant="secondary" className="hidden sm:inline-flex">
          {ROLE_LABELS[role]}
        </Badge>

        {/* 1. Existing theme button */}
        <ThemeModeToggle />

        {/* 2. Profile icon button */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 hover:text-sky-700 dark:bg-sky-950/50 dark:text-sky-400 dark:hover:bg-sky-900/60 dark:hover:text-sky-300 transition-colors"
                render={<Link href="/profile" />}
              />
            }
          >
            <User className="size-4" aria-hidden />
            <span className="sr-only">Account profile</span>
          </TooltipTrigger>
          <TooltipContent>Profile</TooltipContent>
        </Tooltip>

        {/* 3. Logout button with icon and label */}
        <Button
          type="button"
          disabled={isLoading}
          onClick={() => {
            void logout();
          }}
          className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium border border-[#F8D2D2] dark:border-rose-950/60 bg-[#FCE8E8] text-[#B4232F] hover:bg-[#FAD7D7] hover:text-[#9A1C26] dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60 dark:hover:text-rose-200 transition-colors focus-visible:ring-rose-400"
          aria-label="Logout of EduCore"
        >
          <LogOut className="size-3.5" aria-hidden />
          <span>{isLoading ? "Signing out…" : "Logout"}</span>
        </Button>
      </div>
    </header>
  );
}
