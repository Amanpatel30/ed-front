import { PublicShell } from "@/components/layout/public-shell";

/**
 * Public shell: light academic theme. The authenticated dashboard deliberately
 * uses a different (dark) theme, so this layout does not set `.dark`.
 *
 * Redirects logged-in users away from visitor-only public routes to /dashboard.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicShell>{children}</PublicShell>;
}
