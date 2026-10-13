"use client";

import { skipToken } from "@reduxjs/toolkit/query/react";
import { BookOpen, Search, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { departmentOptionsFromCourses } from "@/components/courses/department-options";
import { SelfEnrollDialog } from "@/components/enrollments/self-enroll-dialog";
import type { FieldOption } from "@/components/shared/form-fields";
import { PageHeader } from "@/components/shared/page-header";
import { TablePagination } from "@/components/shared/pagination";
import { QueryState } from "@/components/shared/query-states";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { usePublicCoursesQuery } from "@/lib/api/coursesApi";
import { normalizeApiError } from "@/lib/api/error";
import { useMyEnrollmentsQuery } from "@/lib/api/enrollmentsApi";
import { useAppSelector } from "@/lib/hooks";
import type { Course } from "@/lib/types";

const PAGE_SIZE = 12;

/**
 * Public course catalogue. Anonymous visitors can freely browse open courses
 * without signing in or presenting an access token.
 * Authenticated students can enroll directly from here.
 */
export default function PublicCatalogPage() {
  const role = useAppSelector((state) => state.auth.user?.role);
  const isStudent = role === "STUDENT";

  const coursesQuery = usePublicCoursesQuery();
  // A student's own enrollments carry the open semesters for self-enrollment.
  const myEnrollmentsQuery = useMyEnrollmentsQuery(isStudent ? undefined : skipToken);

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [page, setPage] = useState(1);
  const [enrolling, setEnrolling] = useState<Course | null>(null);

  const error = normalizeApiError(coursesQuery.error);
  const courses = coursesQuery.data?.courses ?? [];
  const departmentOptions = departmentOptionsFromCourses(courses);

  const myEnrollments = myEnrollmentsQuery.data?.enrollments ?? [];
  const openSemesters: FieldOption[] = [
    ...new Map(
      myEnrollments.flatMap((enrollment) =>
        enrollment.semester.status === "OPEN"
          ? [
              [
                enrollment.semesterId,
                {
                  value: enrollment.semesterId,
                  label: `${enrollment.semester.name} · ${enrollment.semester.academicYear}`,
                },
              ] as const,
            ]
          : []
      )
    ).values(),
  ];

  const term = search.trim().toLowerCase();
  const filtered = courses.filter((course) => {
    if (department !== "all" && course.departmentId !== department) return false;
    if (!term) return true;

    return (
      course.code.toLowerCase().includes(term) ||
      course.name.toLowerCase().includes(term) ||
      (course.department?.name.toLowerCase().includes(term) ?? false)
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
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 space-y-6">
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

      <QueryState
        isLoading={coursesQuery.isLoading}
        error={error}
        isEmpty={coursesQuery.isSuccess && courses.length === 0}
        emptyTitle="No course is open"
        emptyDescription="Nothing in the catalog is currently accepting students."
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
                placeholder="Search code, name or department"
                aria-label="Search the catalog"
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
                      <TableHead>Course</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Credits</TableHead>
                      <TableHead className="text-right">Capacity</TableHead>
                      {isStudent ? (
                        <TableHead className="text-right">Actions</TableHead>
                      ) : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visible.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-mono text-xs">
                          {course.code}
                        </TableCell>
                        <TableCell className="font-medium">
                          {course.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {course.department?.name ?? course.departmentId}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {course.credits}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {course.capacity}
                        </TableCell>
                        {isStudent ? (
                          <TableCell>
                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                onClick={() => setEnrolling(course)}
                              >
                                Enroll
                              </Button>
                            </div>
                          </TableCell>
                        ) : null}
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

