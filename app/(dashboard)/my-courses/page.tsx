"use client";

import { useState } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { TablePagination } from "@/components/shared/pagination";
import { QueryState, UnavailableState } from "@/components/shared/query-states";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent } from "@/components/ui/card";
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
import { formatDate } from "@/lib/format";
import { PERMISSIONS } from "@/lib/roles";
import type { AssignedCourse } from "@/lib/types";

const PAGE_SIZE = 10;

/**
 * The courses the signed-in instructor is assigned to. Everything here comes from
 * ASSIGNED_COURSE_VIEW; nothing is inferred from the catalogue.
 */
export default function MyCoursesPage() {
  const coursesQuery = useAssignedCoursesQuery();
  const [page, setPage] = useState(1);

  const error = normalizeApiError(coursesQuery.error);
  const courses = coursesQuery.data?.courses ?? [];

  const totalCredits = courses.reduce((total, course) => total + course.credits, 0);
  const totalCapacity = courses.reduce(
    (total, course) => total + course.capacity,
    0
  );
  const departmentCodes = new Set(
    courses.map((course) => course.department?.code ?? course.departmentId)
  );

  const totalPages = Math.max(1, Math.ceil(courses.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = courses.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="My courses"
        description="Courses assigned to you. Assignments are made by an administrator."
      />

      <QueryState
        isLoading={coursesQuery.isLoading}
        error={error}
        isEmpty={coursesQuery.isSuccess && courses.length === 0}
        emptyTitle="No course is assigned to you"
        emptyDescription="An administrator assigns instructors to courses. Once you have one, it appears here."
        requiredPermission={PERMISSIONS.assignedCourses}
        onRetry={coursesQuery.refetch}
        loadingRows={5}
      >
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Assigned courses" value={courses.length} />
            <StatCard label="Credit load" value={totalCredits} />
            <StatCard
              label="Departments"
              value={departmentCodes.size}
              hint="Departments your assigned courses belong to"
            />
            <StatCard
              label="Total capacity"
              value={totalCapacity}
              hint="Seats across your courses"
            />
          </div>

          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Credits</TableHead>
                    <TableHead className="text-right">Capacity</TableHead>
                    <TableHead>Assigned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((course: AssignedCourse) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-mono text-xs">
                        {course.code}
                      </TableCell>
                      <TableCell className="font-medium">{course.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {course.department?.name ?? course.departmentId}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {course.credits}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {course.capacity}
                      </TableCell>
                      {/* The API returns only the calling instructor, so this is their own assignment. */}
                      <TableCell className="text-muted-foreground tabular-nums">
                        {formatDate(
                          course.instructors[0]?.CourseInstructor.assignedAt
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {totalPages > 1 ? (
            <TablePagination
              page={currentPage}
              totalPages={totalPages}
              total={courses.length}
              unit="course"
              onPageChange={setPage}
            />
          ) : null}

          <UnavailableState
            title="Rosters and grades are not available yet"
            endpoint="GET /api/courses/:id/enrollments"
            description="Your role holds the grants for reading a roster and recording grades, but the API has no endpoint for either, so no student list or grade entry is shown here."
          />
        </div>
      </QueryState>
    </div>
  );
}
