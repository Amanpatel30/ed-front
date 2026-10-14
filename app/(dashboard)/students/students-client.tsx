"use client";

import { useMemo } from "react";
import { Users } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import {
  DataTable,
  DataTableToolbar,
  exportToCsv,
  type TableColumn,
  useTableQuery,
} from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDepartmentsQuery } from "@/lib/api/departmentsApi";
import { normalizeApiError } from "@/lib/api/error";
import { useStudentsQuery } from "@/lib/api/studentsApi";
import type { Student } from "@/lib/types";

export default function StudentsClient() {
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
    initialSortBy: "studentCode",
    initialSortOrder: "asc",
    initialFilters: { status: "all", departmentId: "all" },
  });

  const studentsQuery = useStudentsQuery(queryArgs);
  const departmentsQuery = useDepartmentsQuery({ isActive: true });

  const error = normalizeApiError(studentsQuery.error);
  const students = studentsQuery.data?.students ?? [];
  const total = studentsQuery.data?.total ?? studentsQuery.data?.count ?? 0;
  const totalPages =
    studentsQuery.data?.totalPages ?? Math.max(1, Math.ceil(total / pageSize));

  const departments = departmentsQuery.data?.departments ?? [];

  const columns: TableColumn<Student>[] = useMemo(
    () => [
      {
        key: "studentCode",
        header: "Student ID",
        sortable: true,
        sortKey: "studentCode",
        width: "130px",
        render: (student) => (
          <span className="font-mono text-xs font-semibold">
            {student.studentCode}
          </span>
        ),
      },
      {
        key: "name",
        header: "Full Name",
        render: (student) => (
          <div className="flex flex-col">
            <span className="font-medium text-foreground">
              {student.user?.name || "—"}
            </span>
            <span className="text-xs text-muted-foreground">
              {student.user?.email || "—"}
            </span>
          </div>
        ),
        exportValue: (student) => student.user?.name || "",
      },
      {
        key: "department",
        header: "Department",
        render: (student) => (
          <span className="text-muted-foreground">
            {student.department?.name ?? student.department?.code ?? "—"}
          </span>
        ),
        exportValue: (student) => student.department?.name ?? "",
      },
      {
        key: "enrollmentYear",
        header: "Cohort Year",
        align: "right",
        className: "tabular-nums text-right",
        render: (student) => (
          <span>{student.enrollmentYear ?? "—"}</span>
        ),
      },
      {
        key: "status",
        header: "Status",
        align: "right",
        render: (student) => (
          <div className="flex justify-end">
            <Badge
              variant={student.status === "ACTIVE" ? "secondary" : "outline"}
              className="text-xs capitalize"
            >
              {student.status.toLowerCase()}
            </Badge>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Directory"
        description="Enrolled students across institutional departments."
      />

      <div className="space-y-4">
        <DataTableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search code, name, or email..."
          isFiltered={isFiltered}
          onClearFilters={resetFilters}
          onExportCsv={() => exportToCsv("student-directory", columns, students)}
          countSummary={
            total > 0
              ? `${students.length} of ${total} students`
              : undefined
          }
          filters={
            <div className="flex flex-wrap items-center gap-2">
              <Select
                items={Object.fromEntries(
                  departments.map((d) => [d.id, `${d.name} (${d.code})`])
                )}
                value={filters.departmentId}
                onValueChange={(val) => setFilter("departmentId", String(val))}
              >
                <SelectTrigger className="h-9 sm:w-48 text-sm" aria-label="Department filter">
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                items={{ all: "All statuses", ACTIVE: "Active", INACTIVE: "Inactive" }}
                value={filters.status}
                onValueChange={(val) => setFilter("status", String(val))}
              >
                <SelectTrigger className="h-9 sm:w-36 text-sm" aria-label="Status filter">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />

        <DataTable
          data={students}
          columns={columns}
          loading={studentsQuery.isLoading || studentsQuery.isFetching}
          isError={studentsQuery.isError}
          errorMessage={error?.message}
          onRetry={studentsQuery.refetch}
          emptyTitle="No students found"
          emptyDescription={
            isFiltered
              ? "No students match your filter criteria."
              : "No students are currently registered."
          }
          emptyIcon={Users}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          pagination={{
            page,
            pageSize,
            total,
            totalPages,
            pageSizeOptions: [10, 20, 50],
            unit: "students",
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
          }}
        />
      </div>
    </div>
  );
}

