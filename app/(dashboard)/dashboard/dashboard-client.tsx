"use client";

import { AdminOverview } from "@/components/dashboard/admin-overview";
import { InstructorOverview } from "@/components/dashboard/instructor-overview";
import { StudentOverview } from "@/components/dashboard/student-overview";
import { useAppSelector } from "@/lib/hooks";

/**
 * The authenticated shell renders this only once a session exists, so the role
 * is known here. Each overview reads permissions from `lib/roles.ts` to decide
 * what to request.
 */
export default function DashboardClient() {
  const role = useAppSelector((state) => state.auth.user?.role);

  if (role === "STUDENT") return <StudentOverview />;
  if (role === "INSTRUCTOR") return <InstructorOverview />;
  if (role === "ADMIN" || role === "SUPER_ADMIN") {
    return <AdminOverview role={role} />;
  }
  return null;
}

