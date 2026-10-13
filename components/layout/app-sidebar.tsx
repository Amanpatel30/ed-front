"use client";

import { ChevronsUpDown, GraduationCap, KeyRound, LogOut, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { ProfileDialog } from "@/components/profile/profile-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { useLogoutMutation } from "@/lib/api/authApi";
import { isPathWithin, navigationFor } from "@/lib/navigation";
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
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
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
  const { isMobile } = useSidebar();
  const [logout, { isLoading }] = useLogoutMutation();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<"profile" | "password">("profile");

  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton size="lg" aria-label="Account menu">
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
                  <ChevronsUpDown className="ml-auto" aria-hidden />
                </SidebarMenuButton>
              }
            />
            <DropdownMenuContent
              align="end"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
              className="w-56"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <span className="truncate font-medium leading-none">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider pt-0.5">
                      {ROLE_LABELS[user.role]}
                    </span>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => {
                    setOpen(false);
                    setInitialTab("profile");
                    setProfileOpen(true);
                  }}
                >
                  <User aria-hidden className="mr-2 size-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setOpen(false);
                    setInitialTab("password");
                    setProfileOpen(true);
                  }}
                >
                  <KeyRound aria-hidden className="mr-2 size-4" />
                  Change Password
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  variant="destructive"
                  disabled={isLoading}
                  onClick={() => {
                    setOpen(false);
                    void logout();
                  }}
                >
                  <LogOut aria-hidden className="mr-2 size-4" />
                  {isLoading ? "Signing out…" : "Sign out"}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <ProfileDialog
        key={profileOpen ? `profile-dlg-${initialTab}` : "closed"}
        open={profileOpen}
        onOpenChange={setProfileOpen}
        user={user}
        initialTab={initialTab}
      />
    </>
  );
}
