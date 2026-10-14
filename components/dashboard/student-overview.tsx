"use client";

import {
  BookOpen,
  CircleCheck,
  ClipboardList,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-states";
import { StatCard } from "@/components/shared/stat-card";
import { EnrollmentStatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { normalizeApiError } from "@/lib/api/error";
import { useMyEnrollmentsQuery } from "@/lib/api/enrollmentsApi";
import { formatDate } from "@/lib/format";
import { PERMISSIONS } from "@/lib/roles";

/**
 * Student overview. Built entirely from GET /api/enrollments/me — the student's
 * only readable enrollment source — so credits and counts cover exactly the
 * records the API returned.
 */
export function StudentOverview() {
  const enrollmentsQuery = useMyEnrollmentsQuery();
  const error = normalizeApiError(enrollmentsQuery.error);

  const header = (
    <PageHeader
      title="My studies"
      description="Your enrollment record for every course you have taken."
      actions={
        <Link
          href="/dashboard/catalog"
          className={buttonVariants()}
        >
          <BookOpen aria-hidden />
          Browse catalog
        </Link>
      }
    />
  );

  const response = enrollmentsQuery.data;

  if (!response) {
    return (
      <div className="space-y-6">
        {header}

        <QueryState
          isLoading={error === null}
          error={error}
          requiredPermission={PERMISSIONS.ownEnrollment}
          onRetry={enrollmentsQuery.refetch}
        >
          {null}
        </QueryState>
      </div>
    );
  }

  const enrollments = response.enrollments;

  const active = enrollments.filter(
    (enrollment) => enrollment.status === "ACTIVE"
  );

  const credits = active.reduce(
    (sum, enrollment) => sum + enrollment.course.credits,
    0
  );

  const semesters = new Set(
    enrollments.map((enrollment) => enrollment.semester.id)
  ).size;

  return (
    <div className="space-y-6">
      {header}

      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active courses"
          value={active.length}
          hint="Currently enrolled"
          icon={CircleCheck}
        />

        <StatCard
          label="Credits enrolled"
          value={credits}
          hint="Across active courses"
          icon={GraduationCap}
        />

        <StatCard
          label="Enrollment records"
          value={response.count}
          hint="Including dropped courses"
          icon={ClipboardList}
        />

        <StatCard
          label="Semesters"
          value={semesters}
          hint="Semesters you have enrolled in"
          icon={BookOpen}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My enrollments</CardTitle>
        </CardHeader>

        <CardContent>
          {enrollments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You have not enrolled in any course yet. Browse the catalog to
              start.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {enrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      <span className="font-mono text-xs">
                        {enrollment.course.code}
                      </span>

                      <span className="block font-medium">
                        {enrollment.course.name}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="block text-sm">
                        {enrollment.semester.name}
                      </span>

                      <span className="block text-xs text-muted-foreground">
                        {enrollment.semester.academicYear}
                      </span>
                    </TableCell>

                    <TableCell className="tabular-nums">
                      {enrollment.course.credits}
                    </TableCell>

                    <TableCell>
                      {formatDate(enrollment.enrollmentDate)}
                    </TableCell>

                    <TableCell>{enrollment.grade ?? "—"}</TableCell>

                    <TableCell>
                      <EnrollmentStatusBadge status={enrollment.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}