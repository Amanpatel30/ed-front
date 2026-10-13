"use client";

import { BookOpen, Building2, GraduationCap, Users } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-states";
import { StatCard } from "@/components/shared/stat-card";
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
import { useAssignedCoursesQuery } from "@/lib/api/coursesApi";
import { PERMISSIONS } from "@/lib/roles";

/**
 * Instructor overview. ASSIGNED_COURSE_VIEW is the instructor's only course
 * permission — there is no endpoint they may call for enrollment records — so
 * this view never reports on students.
 */
export function InstructorOverview() {
  const coursesQuery = useAssignedCoursesQuery();
  const error = normalizeApiError(coursesQuery.error);

  const header = (
    <PageHeader
      title="My teaching"
      description="The courses the institution has assigned to you."
    />
  );

  const response = coursesQuery.data;

  if (!response) {
    return (
      <div className="space-y-6">
        {header}
        <QueryState
          isLoading={error === null}
          error={error}
          requiredPermission={PERMISSIONS.catalog}
          onRetry={coursesQuery.refetch}
        >
          {null}
        </QueryState>
      </div>
    );
  }

  const courses = response.courses;
  const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);
  const departments = new Set(
    courses.map((course) => course.department?.code ?? course.departmentId)
  ).size;

  return (
    <div className="space-y-6">
      {header}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Assigned courses"
          value={response.count}
          hint="In the current catalogue"
          icon={GraduationCap}
        />
        <StatCard
          label="Credit load"
          value={totalCredits}
          hint="Credits across assigned courses"
          icon={BookOpen}
        />
        <StatCard
          label="Departments"
          value={departments}
          hint="Departments your courses belong to"
          icon={Building2}
        />
        <StatCard
          label="Total capacity"
          value={courses.reduce((sum, course) => sum + course.capacity, 0)}
          hint="Seats across your assigned courses"
          icon={Users}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned courses</CardTitle>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No courses have been assigned to you yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Instructors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <span className="font-mono text-xs">{course.code}</span>
                      <span className="block font-medium">{course.name}</span>
                    </TableCell>
                    <TableCell>
                      {course.department?.code ?? course.departmentId}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {course.credits}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {course.capacity}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {course.instructors.length}
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
