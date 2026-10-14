"use client";

import { GraduationCap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { HOME_ROUTE, isPathWithin, navigationFor } from "@/lib/navigation";
import { ROLE_LABELS } from "@/lib/roles";
import type { AuthUser } from "@/lib/types";

/**
 * Navigation is derived from the permissions the API actually grants
 * (`lib/roles.ts`), so no role is offered a link whose endpoint answers 403.
 */
export function AppSidebar({ user }: { user: AuthUser }) {
  const pathname = usePathname();
  const groups = navigationFor(user.role);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="group-data-[collapsible=icon]:pt-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href={HOME_ROUTE} />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <GraduationCap className="size-4" aria-hidden />
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-medium">EduCore</span>
                <span className="truncate text-xs text-muted-foreground">
                  {ROLE_LABELS[user.role]} workspace
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isPathWithin(pathname, item.href)}
                      tooltip={item.title}
                    >
                      <item.icon aria-hidden />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <UserMenu user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function UserMenu({ user }: { user: AuthUser }) {
  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          aria-label="View user profile"
          render={<Link href="/profile" />}
        >
          <Avatar className="size-8 rounded-lg">
            <AvatarFallback className="rounded-lg">
              {initials || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left leading-tight">
            <span className="truncate font-medium">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
