"use client";

export const instant = false;

import { Pencil, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { departmentOptionsFromCourses } from "@/components/courses/department-options";
import { CourseFormDialog } from "@/components/courses/course-form-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { TablePagination } from "@/components/shared/pagination";
import { QueryState } from "@/components/shared/query-states";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useDepartmentsQuery } from "@/lib/api/departmentsApi";
import { PERMISSIONS } from "@/lib/roles";
import type { FieldOption } from "@/components/shared/form-fields";
import type { Course } from "@/lib/types";

const PAGE_SIZE = 10;

/**
 * The only course list the API offers is the catalogue, which never contains a
 * deactivated course, so this screen shows the active catalogue only. Status is
 * therefore not a column or a filter here; the edit dialog is where a course is
 * retired, and the course detail page is the only place an inactive one can
 * still be seen.
 */
export default function CoursesPage() {
  const coursesQuery = useCourseCatalogQuery();
  // Directory of departments for the course editor dialog if permitted.
  const departmentsQuery = useDepartmentsQuery({ isActive: true });

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [page, setPage] = useState(1);
  const [formCourse, setFormCourse] = useState<Course | "new" | null>(null);

  const courseError = normalizeApiError(coursesQuery.error);
  const error = courseError;
  const requiredPermission = PERMISSIONS.catalog;
  const isLoading = coursesQuery.isLoading;

  const courses = coursesQuery.data?.courses ?? [];
  const departmentOptions: FieldOption[] = departmentsQuery.data?.departments?.length
    ? departmentsQuery.data.departments.map((dept) => ({
        value: dept.id,
        label: `${dept.name} (${dept.code})`,
      }))
    : departmentOptionsFromCourses(courses);

  const term = search.trim().toLowerCase();
  const filtered = courses.filter((course) => {
    if (department !== "all" && course.departmentId !== department) return false;
    if (!term) return true;

    return (
      course.code.toLowerCase().includes(term) ||
      course.name.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const filtersActive = term !== "" || department !== "all";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Course catalogue"
        description="Active courses only — the API does not return deactivated ones. A course can be retired from its edit dialog."
        actions={
          <Button onClick={() => setFormCourse("new")}>
            <Plus aria-hidden />
            New course
          </Button>
        }
      />

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={coursesQuery.isSuccess && courses.length === 0}
        emptyTitle="The catalogue is empty"
        emptyDescription="Create the first course to start building the catalogue."
        requiredPermission={requiredPermission}
        onRetry={coursesQuery.refetch}
        loadingRows={6}
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative sm:max-w-xs sm:flex-1">
              <Search
                className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search code or name"
                aria-label="Search courses"
                className="pl-8"
              />
            </div>

            <Select
              items={Object.fromEntries(
                departmentOptions.map((option) => [option.value, option.label])
              )}
              value={department}
              onValueChange={(next) => {
                setDepartment(String(next));
                setPage(1);
              }}
            >
              <SelectTrigger className="sm:w-56" aria-label="Filter by department">
                <SelectValue />
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

            {filtersActive ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setDepartment("all");
                  setPage(1);
                }}
              >
                <X aria-hidden />
                Clear
              </Button>
            ) : null}

            <p className="text-xs text-muted-foreground tabular-nums sm:ml-auto">
              {filtered.length} of {courses.length} courses
            </p>
          </div>

          <Card>
            <CardContent>
              {visible.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No course matches these filters.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Credits</TableHead>
                      <TableHead className="text-right">Capacity</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visible.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-mono text-xs">
                          <Link
                            href={`/courses/${course.id}`}
                            className="underline-offset-4 hover:underline"
                          >
                            {course.code}
                          </Link>
                        </TableCell>
                        <TableCell className="font-medium">
                          {course.name}
                        </TableCell>
                        <TableCell>
                          {course.department?.code ?? course.departmentId}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {course.credits}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {course.capacity}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setFormCourse(course)}
                            >
                              <Pencil aria-hidden />
                              Edit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {totalPages > 1 ? (
            <TablePagination
              page={currentPage}
              totalPages={totalPages}
              total={filtered.length}
              unit="course"
              onPageChange={setPage}
            />
          ) : null}
        </div>
      </QueryState>

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
