"use client";

import { BookOpen, CalendarDays, GraduationCap, Users } from "lucide-react";

import { BarList } from "@/components/shared/bar-list";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-states";
import { StatCard } from "@/components/shared/stat-card";
import { SemesterStatusBadge } from "@/components/shared/status-badge";
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
import { useCourseCatalogQuery } from "@/lib/api/coursesApi";
import { useEnrollmentsQuery } from "@/lib/api/enrollmentsApi";
import { useSemestersQuery } from "@/lib/api/semestersApi";
import { formatDate } from "@/lib/format";
import { PERMISSIONS } from "@/lib/roles";
import type { RoleName } from "@/lib/types";

/**
 * Overview for ADMIN and SUPER_ADMIN. Every value below is read from a response.
 */
export function AdminOverview({ role }: { role: RoleName }) {
  const isSuperAdmin = role === "SUPER_ADMIN";

  const semestersQuery = useSemestersQuery();
  const enrollmentsQuery = useEnrollmentsQuery();
  const catalogQuery = useCourseCatalogQuery();

  const header = (
    <PageHeader
      title={isSuperAdmin ? "Institution overview" : "Academic overview"}
      description={
        isSuperAdmin
          ? "Catalogue, semester calendar and enrollment records across the institution."
          : "Semester calendar and enrollment records across the institution."
      }
    />
  );

  const error =
    normalizeApiError(enrollmentsQuery.error) ??
    normalizeApiError(semestersQuery.error) ??
    normalizeApiError(catalogQuery.error);

  const retry = () => {
    enrollmentsQuery.refetch();
    semestersQuery.refetch();
    catalogQuery.refetch();
  };

  const enrollmentsResponse = enrollmentsQuery.data;
  const semestersResponse = semestersQuery.data;
  const catalogResponse = catalogQuery.data;

  if (!enrollmentsResponse || !semestersResponse || !catalogResponse) {
    return (
      <div className="space-y-6">
        {header}
        <QueryState
          isLoading={error === null}
          error={error}
          requiredPermission={PERMISSIONS.enrollment}
          onRetry={retry}
        >
          {null}
        </QueryState>
      </div>
    );
  }

  const enrollments = enrollmentsResponse.enrollments;
  const semesters = semestersResponse.semesters;

  const active = enrollments.filter(
    (enrollment) => enrollment.status === "ACTIVE"
  );
  const students = new Set(active.map((enrollment) => enrollment.studentId))
    .size;

  // Computed from the enrollment rows themselves, so a semester the API did not
  // return is never compared here.
  const bySemester = new Map<string, number>();
  for (const enrollment of enrollments) {
    const label = `${enrollment.semester.name} · ${enrollment.semester.academicYear}`;
    bySemester.set(label, (bySemester.get(label) ?? 0) + 1);
  }

  const recent = [...enrollments]
    .sort((a, b) => b.enrollmentDate.localeCompare(a.enrollmentDate))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {header}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Courses"
          value={catalogResponse.count}
          hint="In the catalogue"
          icon={BookOpen}
        />
        <StatCard
          label="Semesters"
          value={semestersResponse.count}
          hint="On the calendar"
          icon={CalendarDays}
        />
        <StatCard
          label="Enrollments"
          value={enrollmentsResponse.count}
          hint={`${active.length} active`}
          icon={GraduationCap}
        />
        <StatCard
          label="Students enrolled"
          value={students}
          hint="With at least one active enrollment"
          icon={Users}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Enrollments per semester</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList
              title="All enrollment records"
              unit="enrollments"
              data={[...bySemester]
                .map(([label, value]) => ({ label, value }))
                .sort((a, b) => b.value - a.value)}
              emptyMessage="No enrollment records yet."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Semester calendar</CardTitle>
          </CardHeader>
          <CardContent>
            {semesters.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No semesters have been created yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {semesters.map((semester) => (
                  <li
                    key={semester.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {semester.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {semester.academicYear} · {formatDate(semester.startDate)}{" "}
                        – {formatDate(semester.endDate)}
                      </p>
                    </div>
                    <SemesterStatusBadge status={semester.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Most recent enrollments</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No enrollment records yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell className="font-medium">
                      {enrollment.student?.user.name ?? enrollment.studentId}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">
                        {enrollment.course.code}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {enrollment.course.name}
                      </span>
                    </TableCell>
                    <TableCell>{enrollment.semester.name}</TableCell>
                    <TableCell>{formatDate(enrollment.enrollmentDate)}</TableCell>
                    <TableCell>
                      {enrollment.status === "ACTIVE" ? "Active" : "Dropped"}
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
