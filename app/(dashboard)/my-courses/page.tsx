"use client";

import { useMemo } from "react";

import { PageHeader } from "@/components/shared/page-header";
import {
  DataTable,
  DataTableToolbar,
  exportToCsv,
  type TableColumn,
  useTableQuery,
} from "@/components/shared/data-table";
import { UnavailableState } from "@/components/shared/query-states";
import { StatCard } from "@/components/shared/stat-card";
import { normalizeApiError } from "@/lib/api/error";
import { useAssignedCoursesQuery } from "@/lib/api/coursesApi";
import { formatDate } from "@/lib/format";
import type { AssignedCourse } from "@/lib/types";

/**
 * The courses the signed-in instructor is assigned to. Everything here comes from
 * ASSIGNED_COURSE_VIEW; nothing is inferred from the catalogue.
 */
export default function MyCoursesPage() {
  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    search,
    setSearch,
    sortBy,
    sortOrder,
    handleSort,
    resetFilters,
    isFiltered,
    queryArgs,
  } = useTableQuery({
    initialPageSize: 10,
    initialSortBy: "code",
    initialSortOrder: "asc",
  });

  const coursesQuery = useAssignedCoursesQuery(queryArgs);

  const error = normalizeApiError(coursesQuery.error);
  const courses = coursesQuery.data?.courses ?? [];
  const total = coursesQuery.data?.total ?? coursesQuery.data?.count ?? 0;
  const totalPages =
    coursesQuery.data?.totalPages ?? Math.max(1, Math.ceil(total / pageSize));

  const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);
  const totalCapacity = courses.reduce(
    (sum, course) => sum + course.capacity,
    0
  );
  const departmentCodes = new Set(
    courses.map((course) => course.department?.code ?? course.departmentId)
  );

  const columns: TableColumn<AssignedCourse>[] = useMemo(
    () => [
      {
        key: "code",
        header: "Code",
        sortable: true,
        sortKey: "code",
        width: "140px",
        render: (course) => (
          <span className="font-mono text-xs font-semibold">{course.code}</span>
        ),
      },
      {
        key: "name",
        header: "Course",
        sortable: true,
        sortKey: "name",
        className: "font-medium",
      },
      {
        key: "department",
        header: "Department",
        render: (course) => (
          <span className="text-muted-foreground">
            {course.department?.name ?? course.departmentId}
          </span>
        ),
        exportValue: (course) =>
          course.department?.name ?? course.departmentId,
      },
      {
        key: "credits",
        header: "Credits",
        sortable: true,
        sortKey: "credits",
        align: "right",
        className: "tabular-nums text-right",
      },
      {
        key: "capacity",
        header: "Capacity",
        sortable: true,
        sortKey: "capacity",
        align: "right",
        className: "tabular-nums text-right",
      },
      {
        key: "assigned",
        header: "Assigned",
        className: "text-muted-foreground tabular-nums",
        render: (course) => (
          <span>
            {formatDate(course.instructors?.[0]?.CourseInstructor?.assignedAt)}
          </span>
        ),
        exportValue: (course) =>
          formatDate(course.instructors?.[0]?.CourseInstructor?.assignedAt),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="My courses"
        description="Courses assigned to you. Assignments are made by an administrator."
      />

      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Assigned courses" value={total} />
          <StatCard label="Credit load (page)" value={totalCredits} />
          <StatCard
            label="Departments (page)"
            value={departmentCodes.size}
            hint="Departments your displayed courses belong to"
          />
          <StatCard
            label="Total capacity (page)"
            value={totalCapacity}
            hint="Seats across displayed courses"
          />
        </div>

        <div className="space-y-4">
          <DataTableToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search assigned courses..."
            isFiltered={isFiltered}
            onClearFilters={resetFilters}
            onExportCsv={() => exportToCsv("my-courses", columns, courses)}
            countSummary={
              total > 0
                ? `${courses.length} of ${total} courses`
                : undefined
            }
          />

          <DataTable
            data={courses}
            columns={columns}
            loading={coursesQuery.isLoading || coursesQuery.isFetching}
            isError={coursesQuery.isError}
            errorMessage={error?.message}
            onRetry={coursesQuery.refetch}
            emptyTitle="No course is assigned to you"
            emptyDescription={
              isFiltered
                ? "No assigned courses match your search."
                : "An administrator assigns instructors to courses. Once you have one, it appears here."
            }
            emptyAction={
              isFiltered ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs text-primary underline"
                >
                  Clear search
                </button>
              ) : undefined
            }
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            pagination={{
              page,
              pageSize,
              total,
              totalPages,
              pageSizeOptions: [10, 20, 50],
              unit: "courses",
              onPageChange: setPage,
              onPageSizeChange: setPageSize,
            }}
          />
        </div>

        <UnavailableState
          title="Rosters and grades are not available yet"
          endpoint="GET /api/courses/:id/enrollments"
          description="Your role holds the grants for reading a roster and recording grades, but the API has no endpoint for either, so no student list or grade entry is shown here."
        />
      </div>
    </div>
  );
}
