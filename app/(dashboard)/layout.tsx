import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Toaster } from "@/components/ui/sonner";

/**
 * Authenticated shell. The dark theme is scoped to this subtree so the public
 * site stays light; the wrapper paints its own background because <body> sits
 * outside this group.
 *
 * The toaster lives inside the `.dark` wrapper so sonner picks up the dark
 * tokens rather than the public site's light ones.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark flex min-h-svh flex-col bg-background text-foreground">
      <DashboardShell>{children}</DashboardShell>
      <Toaster position="top-right" />
    </div>
  );
}
