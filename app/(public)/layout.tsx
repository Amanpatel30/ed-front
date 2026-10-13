import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { Toaster } from "@/components/ui/sonner";

/**
 * Public shell: light academic theme. The authenticated dashboard deliberately
 * uses a different (dark) theme, so this layout does not set `.dark`.
 *
 * Each shell mounts its own toaster: sonner themes itself from the CSS variables
 * around it, so a single toaster higher in the tree could not be dark in the
 * dashboard and light here.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
      <Toaster position="top-right" />
    </div>
  );
}
