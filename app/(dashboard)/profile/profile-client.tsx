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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChangePasswordMutation } from "@/lib/api/authApi";
import { normalizeApiError } from "@/lib/api/error";
import { useAppSelector } from "@/lib/hooks";
import { ROLE_LABELS } from "@/lib/roles";

export default function ProfileClient() {
  const user = useAppSelector((state) => state.auth.user);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [changePassword, { isLoading }] = useChangePasswordMutation();

  if (!user) return null;

  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

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

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account &amp; Profile</h1>
        <p className="text-sm text-muted-foreground">
          View your profile credentials and manage your account security.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        {/* User Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Profile Overview</CardTitle>
            <CardDescription className="text-xs">
              Your registered identity details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center space-y-2 rounded-lg border bg-muted/40 p-4 text-center">
              <Avatar className="size-16 rounded-xl border">
                <AvatarFallback className="rounded-xl text-lg font-semibold">
                  {initials || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-sm leading-tight">{user.name}</h3>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <div className="flex gap-2 pt-1">
                <Badge variant="outline" className="text-xs">
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

            <div className="divide-y rounded-lg border text-xs">
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <UserIcon className="size-3.5" aria-hidden />
                  Name
                </span>
                <span className="font-medium text-foreground">{user.name}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-3.5" aria-hidden />
                  Email
                </span>
                <span className="font-medium text-foreground">{user.email}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="size-3.5" aria-hidden />
                  Role
                </span>
                <span className="font-medium text-foreground">{ROLE_LABELS[user.role]}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Lock className="size-3.5" aria-hidden />
                  Status
                </span>
                <span className="font-medium text-foreground">{user.status}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Management */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="size-4.5 text-primary" aria-hidden />
              Change Password
            </CardTitle>
            <CardDescription className="text-xs">
              Ensure your account is using a long, random password to stay secure.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {localError && (
              <Alert variant="destructive" className="py-2.5 text-xs">
                <AlertDescription>{localError}</AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert className="border-emerald-500/40 bg-emerald-500/10 text-emerald-500 py-2.5 text-xs">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <AlertDescription className="text-emerald-500 font-medium">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmitPassword} className="space-y-3.5">
              <div className="space-y-1">
                <Label htmlFor="page-current-pwd" className="text-xs">
                  Current Password
                </Label>
                <div className="relative">
                  <Input
                    id="page-current-pwd"
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
                <Label htmlFor="page-new-pwd" className="text-xs">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="page-new-pwd"
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
                <Label htmlFor="page-confirm-pwd" className="text-xs">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="page-confirm-pwd"
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
