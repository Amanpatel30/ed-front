import DashboardClient from "./dashboard-client";

/**
 * Opts out of instant-navigation validation: the dashboard renders one of four
 * role-specific views determined by client-side authentication state.
 */
export const instant = false;

export default function DashboardPage() {
  return <DashboardClient />;
}
