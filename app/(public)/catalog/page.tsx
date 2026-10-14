"use client";

import { skipToken } from "@reduxjs/toolkit/query/react";
import { BookOpen, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { departmentOptionsFromCourses } from "@/components/courses/department-options";
import { SelfEnrollDialog } from "@/components/enrollments/self-enroll-dialog";
import type { FieldOption } from "@/components/shared/form-fields";
import { PageHeader } from "@/components/shared/page-header";
import {
  DataTable,
  DataTableToolbar,
  exportToCsv,
  type TableColumn,
  useTableQuery,
} from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePublicCoursesQuery } from "@/lib/api/coursesApi";
import { normalizeApiError } from "@/lib/api/error";
import { useMyEnrollmentsQuery } from "@/lib/api/enrollmentsApi";
import { useSemestersQuery } from "@/lib/api/semestersApi";
import { useAppSelector } from "@/lib/hooks";
import type { Course } from "@/lib/types";

/**
 * Public course catalogue. Anonymous visitors can freely browse open courses
 * without signing in or presenting an access token.
 * Authenticated students can enroll directly from here.
 */
export default function PublicCatalogPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const role = user?.role;
  const isStudent = role?.toUpperCase() === "STUDENT";
  const isAnonymous = !user;
  const showActions = isAnonymous || isStudent;

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
    filters,
    setFilter,
    resetFilters,
    isFiltered,
    queryArgs,
  } = useTableQuery({
    initialPageSize: 10,
    initialSortBy: "code",
    initialSortOrder: "asc",
    initialFilters: { departmentId: "all" },
  });

  const coursesQuery = usePublicCoursesQuery(queryArgs);
  const semestersQuery = useSemestersQuery(user ? undefined : skipToken);
  const myEnrollmentsQuery = useMyEnrollmentsQuery(isStudent ? undefined : skipToken);

  const [enrolling, setEnrolling] = useState<Course | null>(null);

  const error = normalizeApiError(coursesQuery.error);
  const courses = coursesQuery.data?.courses ?? [];
  const total = coursesQuery.data?.total ?? coursesQuery.data?.count ?? 0;
  const totalPages = coursesQuery.data?.totalPages ?? Math.max(1, Math.ceil(total / pageSize));

  const departmentOptions = departmentOptionsFromCourses(courses);

  const openSemestersFromApi: FieldOption[] = (semestersQuery.data?.semesters ?? [])
    .filter((semester) => semester.status === "OPEN")
    .map((semester) => ({
      value: semester.id,
      label: `${semester.name} · ${semester.academicYear}`,
    }));

  const myEnrollments = useMemo(
    () => myEnrollmentsQuery.data?.enrollments ?? [],
    [myEnrollmentsQuery.data?.enrollments]
  );
  const openSemestersFromEnrollments: FieldOption[] = myEnrollments.flatMap(
    (enrollment) =>
      enrollment.semester?.status === "OPEN"
        ? [
            {
              value: enrollment.semesterId,
              label: `${enrollment.semester.name} · ${enrollment.semester.academicYear}`,
            },
          ]
        : []
  );

  const openSemesters: FieldOption[] = [
    ...new Map(
      [...openSemestersFromApi, ...openSemestersFromEnrollments].map((s) => [
        s.value,
        s,
      ])
    ).values(),
  ];

  const enrolledCourseIds = useMemo(
    () =>
      new Set(
        myEnrollments
          .filter((enrollment) => enrollment.status === "ACTIVE")
          .map((enrollment) => String(enrollment.courseId || enrollment.course?.id))
      ),
    [myEnrollments]
  );

  const columns: TableColumn<Course>[] = useMemo(() => {
    const cols: TableColumn<Course>[] = [
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
            {course.department?.name ?? course.department?.code ?? course.departmentId}
          </span>
        ),
        exportValue: (course) => course.department?.name ?? course.departmentId,
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
    ];

    if (showActions) {
      cols.push({
        key: "actions",
        header: "Actions",
        align: "right",
        excludeFromExport: true,
        render: (course) => {
          const isEnrolled = isStudent && enrolledCourseIds.has(String(course.id));

          return (
            <div className="flex justify-end">
              {isEnrolled ? (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Check className="size-3 text-emerald-600" aria-hidden />
                  Enrolled
                </Badge>
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    if (isAnonymous) {
                      router.push("/login?next=/catalog");
                    } else if (isStudent) {
                      setEnrolling(course);
                    }
                  }}
                  className="h-8 text-xs"
                >
                  Enroll
                </Button>
              )}
            </div>
          );
        },
      });
    }

    return cols;
  }, [showActions, isStudent, enrolledCourseIds, isAnonymous, router]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      <PageHeader
        title="Course catalog"
        description={
          isStudent
            ? "Courses open for enrollment this year. Enrolling is only possible while the semester is open and the course still has a seat."
            : "Browse courses currently offered at EduCore. Sign in to your student account to enroll."
        }
        actions={
          role && !isStudent ? (
            <Link
              href="/courses"
              className={buttonVariants({ variant: "outline" })}
            >
              <BookOpen aria-hidden />
              Manage courses
            </Link>
          ) : null
        }
      />

      <div className="space-y-4">
        <DataTableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search code or name..."
          isFiltered={isFiltered}
          onClearFilters={resetFilters}
          onExportCsv={() => exportToCsv("course-catalog", columns, courses)}
          countSummary={
            total > 0
              ? `${courses.length} of ${total} courses`
              : undefined
          }
          filters={
            <Select
              items={Object.fromEntries(
                departmentOptions.map((opt) => [opt.value, opt.label])
              )}
              value={filters.departmentId}
              onValueChange={(next) => setFilter("departmentId", String(next))}
            >
              <SelectTrigger
                className="h-9 sm:w-56 text-sm"
                aria-label="Filter by department"
              >
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {departmentOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />

        <DataTable
          data={courses}
          columns={columns}
          loading={coursesQuery.isLoading || coursesQuery.isFetching}
          isError={coursesQuery.isError}
          errorMessage={error?.message}
          onRetry={coursesQuery.refetch}
          emptyTitle="No course is open"
          emptyDescription={
            isFiltered
              ? "No courses match your search or filter."
              : "Nothing in the catalog is currently accepting students."
          }
          emptyAction={
            isFiltered ? (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Clear filters
              </Button>
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

      {enrolling ? (
        <SelfEnrollDialog
          key={enrolling.id}
          course={enrolling}
          semesters={openSemesters}
          onClose={() => setEnrolling(null)}
        />
      ) : null}
    </div>
  );
}
