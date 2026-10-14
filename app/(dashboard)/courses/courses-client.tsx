"use client";

import { Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { departmentOptionsFromCourses } from "@/components/courses/department-options";
import { CourseFormDialog } from "@/components/courses/course-form-dialog";
import { PageHeader } from "@/components/shared/page-header";
import {
  DataTable,
  DataTableToolbar,
  exportToCsv,
  type ColumnDef,
  useTableQuery,
} from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { normalizeApiError } from "@/lib/api/error";
import { useCourseCatalogQuery } from "@/lib/api/coursesApi";
import { useDepartmentsQuery } from "@/lib/api/departmentsApi";
import { useAppSelector } from "@/lib/hooks";
import { can } from "@/lib/roles";
import type { FieldOption } from "@/components/shared/form-fields";
import type { Course } from "@/lib/types";

/**
 * The only course list the API offers is the catalogue, which never contains a
 * deactivated course, so this screen shows the active catalogue only. Status is
 * therefore not a column or a filter here; the edit dialog is where a course is
 * retired, and the course detail page is the only place an inactive one can
 * still be seen.
 */
export default function CoursesClient() {
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
    initialPageSize: 5,
    initialSortBy: "code",
    initialSortOrder: "asc",
    initialFilters: { departmentId: "all" },
  });

  const coursesQuery = useCourseCatalogQuery(queryArgs);
  const departmentsQuery = useDepartmentsQuery({ isActive: true });

  const user = useAppSelector((state) => state.auth.user);
  const canManage = user?.role ? can.manageCourses(user.role) : false;

  const [formCourse, setFormCourse] = useState<Course | "new" | null>(null);

  const error = normalizeApiError(coursesQuery.error);
  const courses = coursesQuery.data?.courses ?? [];
  const total = coursesQuery.data?.total ?? coursesQuery.data?.count ?? 0;
  const totalPages = coursesQuery.data?.totalPages ?? Math.max(1, Math.ceil(total / pageSize));

  const departmentOptions: FieldOption[] = departmentsQuery.data?.departments?.length
    ? departmentsQuery.data.departments.map((dept) => ({
        value: dept.id,
        label: `${dept.name} (${dept.code})`,
      }))
    : departmentOptionsFromCourses(courses);

  const columns: ColumnDef<Course>[] = useMemo(() => {
    const cols: ColumnDef<Course>[] = [
      {
        accessorKey: "code",
        header: "Code",
        enableSorting: true,
        meta: {
          sortKey: "code",
          width: "140px",
        },
        cell: ({ row }) => (
          <Link
            href={`/courses/${row.original.id}`}
            className="font-mono text-xs font-semibold underline-offset-4 hover:underline text-primary"
          >
            {row.original.code}
          </Link>
        ),
      },
      {
        accessorKey: "name",
        header: "Name",
        enableSorting: true,
        meta: {
          sortKey: "name",
          className: "font-medium",
        },
      },
      {
        id: "department",
        accessorFn: (course) => course.department?.code ?? course.departmentId,
        header: "Department",
        meta: {
          exportValue: (course) => course.department?.code ?? course.departmentId,
        },
        cell: ({ row }) => (
          <span>{row.original.department?.code ?? row.original.departmentId}</span>
        ),
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
    ];

    if (canManage) {
      cols.push({
        id: "actions",
        header: "Actions",
        enableSorting: false,
        meta: {
          align: "right",
          excludeFromExport: true,
        },
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFormCourse(row.original)}
              className="h-8 text-xs"
            >
              <Pencil className="size-3.5 mr-1" aria-hidden />
              Edit
            </Button>
          </div>
        ),
      });
    }

    return cols;
  }, [canManage]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Course catalogue"
        description="Active courses only — the API does not return deactivated ones. A course can be retired from its edit dialog."
        actions={
          canManage ? (
            <Button onClick={() => setFormCourse("new")}>
              <Plus aria-hidden />
              New course
            </Button>
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
          onExportCsv={() => exportToCsv("course-catalogue", columns, courses)}
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
          emptyTitle="The catalogue is empty"
          emptyDescription={
            isFiltered
              ? "No courses match the active search or filters."
              : "Create the first course to start building the catalogue."
          }
          emptyAction={
            isFiltered ? (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Clear filters
              </Button>
            ) : (
              <Button size="sm" onClick={() => setFormCourse("new")}>
                <Plus className="size-4 mr-1" aria-hidden />
                Add course
              </Button>
            )
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

      {formCourse ? (
        <CourseFormDialog
          key={formCourse === "new" ? "new" : formCourse.id}
          course={formCourse === "new" ? undefined : formCourse}
          onClose={() => setFormCourse(null)}
          departments={departmentOptions}
        />
      ) : null}
    </div>
  );
}
