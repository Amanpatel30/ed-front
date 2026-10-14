"use client";

import { Lock, LockOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { SemesterFormDialog } from "@/components/semesters/semester-form-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import {
  DataTable,
  DataTableToolbar,
  exportToCsv,
  type ColumnDef,
  useTableQuery,
} from "@/components/shared/data-table";
import { SemesterStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { normalizeApiError } from "@/lib/api/error";
import {
  useCloseSemesterMutation,
  useDeleteSemesterMutation,
  useOpenSemesterMutation,
  useSemestersQuery,
} from "@/lib/api/semestersApi";
import { formatDate } from "@/lib/format";
import type { Semester } from "@/lib/types";

/**
 * Semester administration. Opening and closing are separate endpoints from the
 * update, so they are separate actions here; nothing changes a status by writing
 * the field directly.
 */
export default function SemestersClient() {
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
    initialSortBy: "startDate",
    initialSortOrder: "desc",
    initialFilters: { status: "all" },
  });

  const semestersQuery = useSemestersQuery(queryArgs);
  const [openSemester, openState] = useOpenSemesterMutation();
  const [closeSemester, closeState] = useCloseSemesterMutation();
  const [deleteSemester, deleteState] = useDeleteSemesterMutation();

  const [formSemester, setFormSemester] = useState<Semester | "new" | null>(null);
  const [deleting, setDeleting] = useState<Semester | null>(null);
  const [transitioning, setTransitioning] = useState<string | null>(null);

  const error = normalizeApiError(semestersQuery.error);
  const semesters = semestersQuery.data?.semesters ?? [];
  const total = semestersQuery.data?.total ?? semestersQuery.data?.count ?? 0;
  const totalPages = semestersQuery.data?.totalPages ?? Math.max(1, Math.ceil(total / pageSize));

  const transition = useCallback(
    async (semester: Semester, action: "open" | "close") => {
      setTransitioning(semester.id);

      try {
        if (action === "open") {
          await openSemester(semester.id).unwrap();
          toast.success(`${semester.name} is open for enrollment`);
        } else {
          await closeSemester(semester.id).unwrap();
          toast.success(`${semester.name} is closed`);
        }
      } catch (mutationError) {
        toast.error(
          normalizeApiError(mutationError)?.message ??
            `Could not ${action} the semester`
        );
      } finally {
        setTransitioning(null);
      }
    },
    [openSemester, closeSemester]
  );

  async function remove(semester: Semester) {
    try {
      await deleteSemester(semester.id).unwrap();
      toast.success(`${semester.name} deleted`);
      setDeleting(null);
    } catch (mutationError) {
      toast.error(
        normalizeApiError(mutationError)?.message ??
          "Could not delete the semester"
      );
    }
  }

  const columns: ColumnDef<Semester>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Semester",
        enableSorting: true,
        meta: {
          sortKey: "name",
          className: "font-medium",
        },
      },
      {
        accessorKey: "academicYear",
        header: "Academic year",
        enableSorting: true,
        meta: {
          sortKey: "academicYear",
          className: "tabular-nums",
        },
      },
      {
        accessorKey: "startDate",
        header: "Runs",
        enableSorting: true,
        meta: {
          sortKey: "startDate",
          className: "text-muted-foreground tabular-nums",
          exportValue: (semester) =>
            `${formatDate(semester.startDate)} - ${formatDate(semester.endDate)}`,
        },
        cell: ({ row }) => (
          <span>
            {formatDate(row.original.startDate)} — {formatDate(row.original.endDate)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        enableSorting: true,
        meta: {
          sortKey: "status",
          exportValue: (semester) => semester.status,
        },
        cell: ({ row }) => <SemesterStatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        meta: {
          align: "right",
          excludeFromExport: true,
        },
        cell: ({ row }) => {
          const semester = row.original;
          return (
            <div className="flex justify-end gap-1">
              {semester.status === "UPCOMING" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={transitioning === semester.id}
                  onClick={() => void transition(semester, "open")}
                  className="h-8 text-xs"
                >
                  <LockOpen className="size-3.5 mr-1" aria-hidden />
                  Open
                </Button>
              ) : null}
              {semester.status === "OPEN" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={transitioning === semester.id}
                  onClick={() => void transition(semester, "close")}
                  className="h-8 text-xs"
                >
                  <Lock className="size-3.5 mr-1" aria-hidden />
                  Close
                </Button>
              ) : null}
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label={`Edit ${semester.name}`}
                onClick={() => setFormSemester(semester)}
              >
                <Pencil className="size-3.5" aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-destructive"
                aria-label={`Delete ${semester.name}`}
                onClick={() => setDeleting(semester)}
              >
                <Trash2 className="size-3.5" aria-hidden />
              </Button>
            </div>
          );
        },
      },
    ],
    [transition, transitioning]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Semesters"
        description="Terms define when enrollment is allowed. A semester must be open before students can enroll."
        actions={
          <Button onClick={() => setFormSemester("new")}>
            <Plus aria-hidden />
            New semester
          </Button>
        }
      />

      <div className="space-y-4">
        <DataTableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search semester or academic year..."
          isFiltered={isFiltered}
          onClearFilters={resetFilters}
          onExportCsv={() => exportToCsv("semesters", columns, semesters)}
          countSummary={
            total > 0
              ? `${semesters.length} of ${total} semesters`
              : undefined
          }
          filters={
            <Select
              items={{
                all: "All statuses",
                UPCOMING: "Upcoming",
                OPEN: "Open",
                CLOSED: "Closed",
              }}
              value={filters.status}
              onValueChange={(next) => setFilter("status", String(next))}
            >
              <SelectTrigger className="h-9 sm:w-44 text-sm" aria-label="Filter by status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="UPCOMING">Upcoming</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        <DataTable
          data={semesters}
          columns={columns}
          loading={semestersQuery.isLoading || semestersQuery.isFetching}
          isError={semestersQuery.isError}
          errorMessage={error?.message}
          onRetry={semestersQuery.refetch}
          emptyTitle="No semesters yet"
          emptyDescription={
            isFiltered
              ? "No semester matches this filter."
              : "Create a semester, then open it so students can enroll."
          }
          emptyAction={
            isFiltered ? (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Clear filters
              </Button>
            ) : (
              <Button size="sm" onClick={() => setFormSemester("new")}>
                <Plus className="size-4 mr-1" aria-hidden />
                Add semester
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
            unit: "semesters",
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
          }}
        />
      </div>

      {formSemester ? (
        <SemesterFormDialog
          key={formSemester === "new" ? "new" : formSemester.id}
          semester={formSemester === "new" ? undefined : formSemester}
          onClose={() => setFormSemester(null)}
        />
      ) : null}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(next) => {
          if (!next) setDeleting(null);
        }}
        title={`Delete ${deleting?.name ?? ""}?`}
        description="This removes the semester from the record. It is only possible while the API allows it — a semester that still holds enrollments will be refused."
        confirmLabel="Delete semester"
        onConfirm={() => {
          if (deleting) void remove(deleting);
        }}
        pending={deleteState.isLoading || openState.isLoading || closeState.isLoading}
      />
    </div>
  );
}
