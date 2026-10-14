"use client";

import { BookOpen, UserMinus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import {
  DataTable,
  DataTableToolbar,
  exportToCsv,
  type TableColumn,
  useTableQuery,
} from "@/components/shared/data-table";
import { StatCard } from "@/components/shared/stat-card";
import { EnrollmentStatusBadge } from "@/components/shared/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { normalizeApiError } from "@/lib/api/error";
import {
  useDropMyEnrollmentMutation,
  useMyEnrollmentsQuery,
} from "@/lib/api/enrollmentsApi";
import { formatDate } from "@/lib/format";
import type { Enrollment } from "@/lib/types";

/**
 * A student's own enrollments. The API drops only inside an open semester, so the
 * action is offered only where it can succeed; the backend still enforces it.
 */
export default function MyEnrollmentsClient() {
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
    initialSortBy: "createdAt",
    initialSortOrder: "desc",
    initialFilters: { status: "all" },
  });

  const enrollmentsQuery = useMyEnrollmentsQuery(queryArgs);
  const [dropMyEnrollment, dropState] = useDropMyEnrollmentMutation();

  const [dropping, setDropping] = useState<Enrollment | null>(null);

  const error = normalizeApiError(enrollmentsQuery.error);
  const enrollments = enrollmentsQuery.data?.enrollments ?? [];
  const total = enrollmentsQuery.data?.total ?? enrollmentsQuery.data?.count ?? 0;
  const totalPages =
    enrollmentsQuery.data?.totalPages ?? Math.max(1, Math.ceil(total / pageSize));

  const active = enrollments.filter(
    (enrollment) => enrollment.status === "ACTIVE"
  );

  const activeCredits = active.reduce(
    (sum, enrollment) => sum + (enrollment.course?.credits ?? 0),
    0
  );

  async function drop(enrollment: Enrollment) {
    try {
      await dropMyEnrollment(enrollment.id).unwrap();
      toast.success(`${enrollment.course.code} dropped`);
      setDropping(null);
    } catch (mutationError) {
      toast.error(
        normalizeApiError(mutationError)?.message ?? "Could not drop the course"
      );
    }
  }

  const columns: TableColumn<Enrollment>[] = useMemo(
    () => [
      {
        key: "course",
        header: "Course",
        render: (enrollment) => (
          <div>
            <span className="font-mono text-xs font-semibold">
              {enrollment.course.code}
            </span>
            <span className="font-medium text-foreground">
              {" "}
              {enrollment.course.name}
            </span>
          </div>
        ),
        exportValue: (enrollment) =>
          `${enrollment.course.code} - ${enrollment.course.name}`,
      },
      {
        key: "department",
        header: "Department",
        className: "text-muted-foreground",
        render: (enrollment) => (
          <span>{enrollment.course.department?.code ?? "—"}</span>
        ),
        exportValue: (enrollment) =>
          enrollment.course.department?.code ?? "",
      },
      {
        key: "semester",
        header: "Semester",
        className: "text-muted-foreground",
        render: (enrollment) => (
          <span>
            {enrollment.semester.name}
            {enrollment.semester.academicYear
              ? ` (${enrollment.semester.academicYear})`
              : ""}
          </span>
        ),
        exportValue: (enrollment) =>
          `${enrollment.semester.name} ${enrollment.semester.academicYear ?? ""}`,
      },
      {
        key: "credits",
        header: "Credits",
        align: "right",
        className: "text-right tabular-nums",
        render: (enrollment) => (
          <span>{enrollment.course.credits}</span>
        ),
        exportValue: (enrollment) => enrollment.course.credits,
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
        align: "center",
        className: "tabular-nums text-center",
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
            <div className="flex justify-end">
              {droppable ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-destructive hover:text-destructive"
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
        title="My enrollments"
        description="Every course you have taken, including dropped ones. Re-enrolling in a course you dropped for the same semester is not possible."
        actions={
          <Link href="/catalog" className={buttonVariants()}>
            <BookOpen aria-hidden />
            Browse catalog
          </Link>
        }
      />

      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Active courses (page)" value={active.length} />
          <StatCard label="Credits enrolled (page)" value={activeCredits} />
          <StatCard label="Total enrollment records" value={total} />
        </div>

        <div className="space-y-4">
          <DataTableToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search enrolled course..."
            isFiltered={isFiltered}
            onClearFilters={resetFilters}
            onExportCsv={() => exportToCsv("my-enrollments", columns, enrollments)}
            countSummary={
              total > 0
                ? `${enrollments.length} of ${total} records`
                : undefined
            }
            filters={
              <Select
                items={{
                  all: "All enrollments",
                  ACTIVE: "Active",
                  DROPPED: "Dropped",
                }}
                value={filters.status}
                onValueChange={(next) => setFilter("status", String(next))}
              >
                <SelectTrigger className="h-9 sm:w-44 text-sm" aria-label="Filter by status">
                  <SelectValue placeholder="All enrollments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All enrollments</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="DROPPED">Dropped</SelectItem>
                </SelectContent>
              </Select>
            }
          />

          <DataTable
            data={enrollments}
            columns={columns}
            loading={enrollmentsQuery.isLoading || enrollmentsQuery.isFetching}
            isError={enrollmentsQuery.isError}
            errorMessage={error?.message}
            onRetry={enrollmentsQuery.refetch}
            emptyTitle="You are not enrolled in anything"
            emptyDescription={
              isFiltered
                ? "No enrollment matches this filter."
                : "Browse the catalog to join a course. Enrollment needs an open semester and an available seat."
            }
            emptyAction={
              isFiltered ? (
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  Clear filters
                </Button>
              ) : (
                <Link href="/catalog" className={buttonVariants({ size: "sm" })}>
                  <BookOpen className="size-4 mr-1" aria-hidden />
                  Browse catalog
                </Link>
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
              unit: "records",
              onPageChange: setPage,
              onPageSizeChange: setPageSize,
            }}
          />
        </div>
      </div>

      <ConfirmDialog
        open={dropping !== null}
        onOpenChange={(next) => {
          if (!next) setDropping(null);
        }}
        title={`Drop ${dropping?.course.code ?? ""}?`}
        description="The record is kept and marked dropped. The seat is not guaranteed to be free again, and re-enrolling in the same course for the same semester is refused afterwards."
        confirmLabel="Drop course"
        onConfirm={() => {
          if (dropping) void drop(dropping);
        }}
        pending={dropState.isLoading}
      />
    </div>
  );
}