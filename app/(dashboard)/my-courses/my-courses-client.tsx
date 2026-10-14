"use client";

import { GraduationCap } from "lucide-react";
import { useMemo, useState } from "react";

import { CourseRosterSection } from "@/components/courses/course-roster-section";
import { PageHeader } from "@/components/shared/page-header";
import {
  DataTable,
  DataTableToolbar,
  exportToCsv,
  type ColumnDef,
  useTableQuery,
} from "@/components/shared/data-table";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { normalizeApiError } from "@/lib/api/error";
import { useAssignedCoursesQuery } from "@/lib/api/coursesApi";
import { formatDate } from "@/lib/format";
import type { AssignedCourse } from "@/lib/types";

/**
 * The courses the signed-in instructor is assigned to. Everything here comes from
 * ASSIGNED_COURSE_VIEW; nothing is inferred from the catalogue.
 */
export default function MyCoursesClient() {
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
    initialPageSize: 5,
    initialSortBy: "code",
    initialSortOrder: "asc",
  });

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const coursesQuery = useAssignedCoursesQuery(queryArgs);

  const error = normalizeApiError(coursesQuery.error);
  const courses = useMemo(
    () => coursesQuery.data?.courses ?? [],
    [coursesQuery.data?.courses]
  );
  const total = coursesQuery.data?.total ?? coursesQuery.data?.count ?? 0;
  const totalPages =
    coursesQuery.data?.totalPages ?? Math.max(1, Math.ceil(total / pageSize));

  const activeCourse = useMemo(() => {
    if (courses.length === 0) return null;
    return courses.find((c) => c.id === selectedCourseId) ?? courses[0];
  }, [courses, selectedCourseId]);

  const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);
  const totalCapacity = courses.reduce(
    (sum, course) => sum + course.capacity,
    0
  );
  const departmentCodes = new Set(
    courses.map((course) => course.department?.code ?? course.departmentId)
  );

  const columns: ColumnDef<AssignedCourse>[] = useMemo(
    () => [
      {
        accessorKey: "code",
        header: "Code",
        enableSorting: true,
        meta: {
          sortKey: "code",
          width: "140px",
        },
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold">{row.original.code}</span>
        ),
      },
      {
        accessorKey: "name",
        header: "Course",
        enableSorting: true,
        meta: {
          sortKey: "name",
          className: "font-medium",
        },
      },
      {
        id: "department",
        header: "Department",
        accessorFn: (course) => course.department?.name ?? course.departmentId,
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.department?.name ?? row.original.departmentId}
          </span>
        ),
        meta: {
          exportValue: (course) =>
            course.department?.name ?? course.departmentId,
        },
      },
      {
        accessorKey: "credits",
        header: "Credits",
        enableSorting: true,
        meta: {
          sortKey: "credits",
          align: "right",
          className: "tabular-nums text-right",
        },
      },
      {
        accessorKey: "capacity",
        header: "Capacity",
        enableSorting: true,
        meta: {
          sortKey: "capacity",
          align: "right",
          className: "tabular-nums text-right",
        },
      },
      {
        id: "assigned",
        header: "Assigned",
        meta: {
          className: "text-muted-foreground tabular-nums",
          exportValue: (course) =>
            formatDate(course.instructors?.[0]?.CourseInstructor?.assignedAt),
        },
        cell: ({ row }) => (
          <span>
            {formatDate(row.original.instructors?.[0]?.CourseInstructor?.assignedAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Roster",
        meta: {
          width: "130px",
          align: "right",
          excludeFromExport: true,
        },
        cell: ({ row }) => {
          const isSelected = activeCourse?.id === row.original.id;
          return (
            <div className="text-right">
              <Button
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setSelectedCourseId(row.original.id)}
              >
                <GraduationCap className="size-3.5 mr-1" aria-hidden />
                {isSelected ? "Selected" : "View roster"}
              </Button>
            </div>
          );
        },
      },
    ],
    [activeCourse?.id]
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

        {activeCourse ? (
          <CourseRosterSection
            key={activeCourse.id}
            courseId={activeCourse.id}
            courseCode={activeCourse.code}
            courseName={activeCourse.name}
          />
        ) : null}
      </div>
    </div>
  );
}

