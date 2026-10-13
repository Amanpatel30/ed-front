"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Shield,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useChangePasswordMutation } from "@/lib/api/authApi";
import { normalizeApiError } from "@/lib/api/error";
import { ROLE_LABELS } from "@/lib/roles";
import type { AuthUser } from "@/lib/types";

export interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AuthUser;
  initialTab?: "profile" | "password";
}

export function ProfileDialog({
  open,
  onOpenChange,
  user,
  initialTab = "profile",
}: ProfileDialogProps) {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setLocalError(null);
      setSuccessMessage(null);
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    }
    onOpenChange(nextOpen);
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);

    if (!currentPassword.trim()) {
      setLocalError("Current password is required.");
      return;
    }

    if (!newPassword.trim()) {
      setLocalError("New password is required.");
      return;
    }

    if (newPassword.length < 8) {
      setLocalError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalError("New password and confirm password do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setLocalError("New password must be different from current password.");
      return;
    }

    try {
      const res = await changePassword({
        currentPassword,
        newPassword,
      }).unwrap();

      const message = res?.message || "Password changed successfully!";
      setSuccessMessage(message);
      toast.success(message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const normalized = normalizeApiError(err);
      const msg =
        normalized?.message ||
        "Failed to change password. Please verify your current password.";
      setLocalError(msg);
      toast.error(msg);
    }
  };

  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <UserIcon className="size-4.5 text-primary" aria-hidden />
            Profile &amp; Account Settings
          </DialogTitle>
          <DialogDescription className="text-xs">
            Review your account profile or change your password.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            setActiveTab(val as string);
            setLocalError(null);
            setSuccessMessage(null);
          }}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="flex items-center gap-1.5 text-xs">
              <UserIcon className="size-3.5" aria-hidden />
              Profile Details
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center gap-1.5 text-xs">
              <KeyRound className="size-3.5" aria-hidden />
              Change Password
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 pt-3">
            <div className="flex items-center gap-3.5 rounded-lg border bg-muted/40 p-3.5">
              <Avatar className="size-12 rounded-lg border">
                <AvatarFallback className="rounded-lg text-sm font-semibold">
                  {initials || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 leading-tight">
                <span className="truncate text-sm font-semibold">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                <div className="mt-1.5 flex items-center gap-2">
                  <Badge variant="outline" className="text-[11px] font-normal">
                    {ROLE_LABELS[user.role]}
                  </Badge>
                  <Badge
                    variant={user.status === "ACTIVE" ? "secondary" : "destructive"}
                    className="text-[10px] uppercase font-semibold"
                  >
                    {user.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="divide-y rounded-lg border text-xs">
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <UserIcon className="size-3.5" aria-hidden />
                  Full Name
                </span>
                <span className="font-medium text-foreground">{user.name}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-3.5" aria-hidden />
                  Email Address
                </span>
                <span className="font-medium text-foreground">{user.email}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="size-3.5" aria-hidden />
                  Assigned Role
                </span>
                <span className="font-medium text-foreground">{ROLE_LABELS[user.role]}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Lock className="size-3.5" aria-hidden />
                  Account Status
                </span>
                <span className="font-medium text-foreground">{user.status}</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="password" className="space-y-3.5 pt-3">
            {localError && (
              <Alert variant="destructive" className="py-2 text-xs">
                <AlertDescription>{localError}</AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert className="border-emerald-500/40 bg-emerald-500/10 text-emerald-500 py-2 text-xs">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <AlertDescription className="text-emerald-500 font-medium">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmitPassword} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="current-pwd" className="text-xs">
                  Current Password
                </Label>
                <div className="relative">
                  <Input
                    id="current-pwd"
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    required
                    autoComplete="current-password"
                    className="pr-9 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showCurrent ? "Hide current password" : "Show current password"}
                  >
                    {showCurrent ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="new-pwd" className="text-xs">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="new-pwd"
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    autoComplete="new-password"
                    className="pr-9 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showNew ? "Hide new password" : "Show new password"}
                  >
                    {showNew ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Must be at least 8 characters long.
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirm-pwd" className="text-xs">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-pwd"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    required
                    autoComplete="new-password"
                    className="pr-9 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirm ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full text-xs"
                >
                  {isLoading ? "Updating password…" : "Update Password"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
