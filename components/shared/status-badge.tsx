import { Badge } from "@/components/ui/badge";
import type { EnrollmentStatus, SemesterStatus } from "@/lib/types";

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "ghost"
  | "link";

const SEMESTER: Record<SemesterStatus, { label: string; variant: BadgeVariant }> =
  {
    UPCOMING: { label: "Upcoming", variant: "outline" },
    OPEN: { label: "Open", variant: "default" },
    CLOSED: { label: "Closed", variant: "secondary" },
  };

const ENROLLMENT: Record<
  EnrollmentStatus,
  { label: string; variant: BadgeVariant }
> = {
  ACTIVE: { label: "Active", variant: "default" },
  DROPPED: { label: "Dropped", variant: "secondary" },
};

export function SemesterStatusBadge({ status }: { status: SemesterStatus }) {
  const { label, variant } = SEMESTER[status] ?? {
    label: status,
    variant: "outline" as BadgeVariant,
  };

  return <Badge variant={variant}>{label}</Badge>;
}

export function EnrollmentStatusBadge({ status }: { status: EnrollmentStatus }) {
  const { label, variant } = ENROLLMENT[status] ?? {
    label: status,
    variant: "outline" as BadgeVariant,
  };

  return <Badge variant={variant}>{label}</Badge>;
}

export function CourseActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? "default" : "secondary"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}
