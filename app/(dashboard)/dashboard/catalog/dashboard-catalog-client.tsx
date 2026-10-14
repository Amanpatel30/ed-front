"use client";

import { PageHeader } from "@/components/shared/page-header";
import { PermissionDeniedState } from "@/components/shared/query-states";
import { CatalogContent } from "@/components/catalog/catalog-content";
import { useAppSelector } from "@/lib/hooks";
import { PERMISSIONS } from "@/lib/roles";

export default function DashboardCatalogClient() {
  const user = useAppSelector((state) => state.auth.user);
  const isStudent = user?.role === "STUDENT";

  if (!isStudent) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Course catalog"
          description="Courses offered at EduCore."
        />
        <PermissionDeniedState
          permission={PERMISSIONS.ownEnrollment}
          description="The dashboard course catalog is restricted to students. Administrators can manage courses under Courses."
        />
      </div>
    );
  }

  return <CatalogContent variant="dashboard" />;
}

