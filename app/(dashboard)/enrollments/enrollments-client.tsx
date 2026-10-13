"use client";

import { Pencil, Plus, UserMinus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EnrollmentFormDialog } from "@/components/enrollments/enrollment-form-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { FieldOption } from "@/components/shared/form-fields";
import { PageHeader } from "@/components/shared/page-header";
import {
  DataTable,
  DataTableToolbar,
  exportToCsv,
  type TableColumn,
  useTableQuery,
} from "@/components/shared/data-table";
import { EnrollmentStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCourseCatalogQuery } from "@/lib/api/coursesApi";
import { normalizeApiError } from "@/lib/api/error";
import {
  useDropEnrollmentMutation,
  useEnrollmentsQuery,
} from "@/lib/api/enrollmentsApi";
import { useSemestersQuery } from "@/lib/api/semestersApi";
import { formatDate } from "@/lib/format";
import type { Enrollment } from "@/lib/types";

/**
 * Every enrollment in the institution, for ADMIN and SUPER_ADMIN.
 * Upgraded with production-ready DataTable, server-side pagination, search, and filtering.
 */
export default function EnrollmentsPage() {
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
    initialPageSize: 15,
    initialSortBy: "createdAt",
    initialSortOrder: "desc",
    initialFilters: { status: "ACTIVE", semesterId: "all" },
  });

  const enrollmentsQuery = useEnrollmentsQuery(queryArgs);
  const coursesQuery = useCourseCatalogQuery();
  const semestersQuery = useSemestersQuery();
  const [dropEnrollment, dropState] = useDropEnrollmentMutation();

  const [editing, setEditing] = useState<Enrollment | "new" | null>(null);
  const [dropping, setDropping] = useState<Enrollment | null>(null);

  const error =
    normalizeApiError(enrollmentsQuery.error) ??
    normalizeApiError(coursesQuery.error) ??
    normalizeApiError(semestersQuery.error);

  const enrollments = enrollmentsQuery.data?.enrollments ?? [];
  const total = enrollmentsQuery.data?.total ?? enrollmentsQuery.data?.count ?? 0;
  const totalPages =
    enrollmentsQuery.data?.totalPages ?? Math.max(1, Math.ceil(total / pageSize));

  const semesters = semestersQuery.data?.semesters ?? [];
  const courses = coursesQuery.data?.courses ?? [];

  const courseOptions: FieldOption[] = courses.map((course) => ({
    value: course.id,
    label: `${course.code} — ${course.name}`,
  }));

  const semesterOptions: FieldOption[] = semesters.map((semester) => ({
    value: semester.id,
    label: `${semester.name} · ${semester.academicYear}`,
  }));

  // Only an open semester can receive an enrollment: the API refuses any other.
  const openSemesterOptions = semesterOptions.filter((option) =>
    semesters.some(
      (semester) => semester.id === option.value && semester.status === "OPEN"
    )
  );

  const studentOptions: FieldOption[] = [
    ...new Map(
      enrollments.flatMap((enrollment) =>
        enrollment.student && enrollment.student.status === "ACTIVE"
          ? [
              [
                enrollment.studentId,
                {
                  value: enrollment.studentId,
                  label: `${enrollment.student.user.name} · ${enrollment.student.studentCode}`,
                },
              ] as const,
            ]
          : []
      )
    ).values(),
  ].sort((a, b) => a.label.localeCompare(b.label));

  async function drop(enrollment: Enrollment) {
    try {
      await dropEnrollment(enrollment.id).unwrap();
      toast.success(
        `${enrollment.course.code} dropped for ${
          enrollment.student?.user.name ?? "the student"
        }`
      );
      setDropping(null);
    } catch (mutationError) {
      toast.error(
        normalizeApiError(mutationError)?.message ?? "Could not drop the enrollment"
      );
    }
  }

  const columns: TableColumn<Enrollment>[] = useMemo(
    () => [
      {
        key: "student",
        header: "Student",
        render: (enrollment) => (
          <div>
            <p className="font-medium">
              {enrollment.student?.user.name ?? enrollment.studentId}
            </p>
            {enrollment.student?.studentCode && (
              <p className="text-xs text-muted-foreground font-mono">
                {enrollment.student.studentCode}
              </p>
            )}
          </div>
        ),
        exportValue: (enrollment) =>
          `${enrollment.student?.user.name ?? enrollment.studentId} (${enrollment.student?.studentCode ?? ""})`,
      },
      {
        key: "course",
        header: "Course",
        render: (enrollment) => (
          <div>
            <span className="font-mono text-xs font-semibold">
              {enrollment.course.code}
            </span>
            <span className="text-muted-foreground"> — {enrollment.course.name}</span>
          </div>
        ),
        exportValue: (enrollment) =>
          `${enrollment.course.code} - ${enrollment.course.name}`,
      },
      {
        key: "semester",
        header: "Semester",
        render: (enrollment) => (
          <span className="text-muted-foreground">
            {enrollment.semester.name}
          </span>
        ),
        exportValue: (enrollment) =>
          `${enrollment.semester.name} (${enrollment.semester.academicYear})`,
      },
      {
        key: "enrollmentDate",
        header: "Enrolled",
        sortable: true,
        sortKey: "enrollmentDate",
        className: "text-muted-foreground tabular-nums",
        render: (enrollment) => (
          <span>{formatDate(enrollment.enrollmentDate)}</span>
        ),
        exportValue: (enrollment) => formatDate(enrollment.enrollmentDate),
      },
      {
        key: "grade",
        header: "Grade",
        sortable: true,
        sortKey: "grade",
        className: "tabular-nums",
        render: (enrollment) => <span>{enrollment.grade ?? "—"}</span>,
        exportValue: (enrollment) => enrollment.grade ?? "",
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        sortKey: "status",
        render: (enrollment) => (
          <EnrollmentStatusBadge status={enrollment.status} />
        ),
        exportValue: (enrollment) => enrollment.status,
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        excludeFromExport: true,
        render: (enrollment) => {
          const droppable =
            enrollment.status === "ACTIVE" &&
            enrollment.semester.status === "OPEN";

          return (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Edit enrollment"
                onClick={() => setEditing(enrollment)}
              >
                <Pencil className="size-3.5" aria-hidden />
              </Button>
              {droppable ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-destructive"
                  onClick={() => setDropping(enrollment)}
                >
                  <UserMinus className="size-3.5 mr-1" aria-hidden />
                  Drop
                </Button>
              ) : null}
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enrollments"
        description="Who is enrolled in what, and for which semester. Dropping keeps the record and marks it dropped."
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus aria-hidden />
            New enrollment
          </Button>
        }
      />

      <div className="space-y-4">
        <DataTableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search student, code, or course..."
          isFiltered={isFiltered}
          onClearFilters={resetFilters}
          onExportCsv={() => exportToCsv("enrollments", columns, enrollments)}
          countSummary={
            total > 0
              ? `${enrollments.length} of ${total} enrollments`
              : undefined
          }
          filters={
            <>
              <Select
                items={{ ACTIVE: "Active", DROPPED: "Dropped", all: "All statuses" }}
                value={filters.status}
                onValueChange={(next) => setFilter("status", String(next))}
              >
                <SelectTrigger className="h-9 sm:w-36 text-sm" aria-label="Filter by status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="DROPPED">Dropped</SelectItem>
                  <SelectItem value="all">All statuses</SelectItem>
                </SelectContent>
              </Select>

              <Select
                items={Object.fromEntries(
                  semesterOptions.map((opt) => [opt.value, opt.label])
                )}
                value={filters.semesterId}
                onValueChange={(next) => setFilter("semesterId", String(next))}
              >
                <SelectTrigger className="h-9 sm:w-52 text-sm" aria-label="Filter by semester">
                  <SelectValue placeholder="All semesters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All semesters</SelectItem>
                  {semesterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
        />

        <DataTable
          data={enrollments}
          columns={columns}
          loading={enrollmentsQuery.isLoading || enrollmentsQuery.isFetching}
          isError={enrollmentsQuery.isError}
          errorMessage={error?.message}
          onRetry={enrollmentsQuery.refetch}
          emptyTitle="No enrollments yet"
          emptyDescription={
            isFiltered
              ? "No enrollment matches these filters."
              : "Enrollments appear here once a student takes a course for a semester."
          }
          emptyAction={
            isFiltered ? (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Clear filters
              </Button>
            ) : (
              <Button size="sm" onClick={() => setEditing("new")}>
                <Plus className="size-4 mr-1" aria-hidden />
                Add enrollment
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
            pageSizeOptions: [10, 15, 25, 50],
            unit: "enrollments",
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
          }}
        />
      </div>

      {editing ? (
        <EnrollmentFormDialog
          key={editing === "new" ? "new" : editing.id}
          enrollment={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          students={studentOptions}
          courses={courseOptions}
          semesters={openSemesterOptions}
        />
      ) : null}

      <ConfirmDialog
        open={dropping !== null}
        onOpenChange={(next) => {
          if (!next) setDropping(null);
        }}
        title={`Drop ${dropping?.course.code ?? ""}?`}
        description="The enrollment is kept and marked dropped. Re-enrolling the same student in the same course and semester afterwards is refused."
        confirmLabel="Drop enrollment"
        onConfirm={() => {
          if (dropping) void drop(dropping);
        }}
        pending={dropState.isLoading}
      />
    </div>
  );
}
