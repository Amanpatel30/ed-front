"use client";

import { useMemo } from "react";
import { Building2 } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import {
  DataTable,
  DataTableToolbar,
  exportToCsv,
  type ColumnDef,
  useTableQuery,
} from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { useDepartmentsQuery } from "@/lib/api/departmentsApi";
import { normalizeApiError } from "@/lib/api/error";
import type { Department } from "@/lib/types";

export default function DepartmentsClient() {
  const {
    search,
    setSearch,
    sortBy,
    sortOrder,
    handleSort,
    resetFilters,
    isFiltered,
  } = useTableQuery({
    initialPageSize: 20,
    initialSortBy: "code",
    initialSortOrder: "asc",
  });

  const departmentsQuery = useDepartmentsQuery();
  const error = normalizeApiError(departmentsQuery.error);

  // Filter client-side by search query (departments endpoint returns small full set)
  const departments = useMemo(() => {
    const rawDepartments = departmentsQuery.data?.departments ?? [];
    let result = [...rawDepartments];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (dept) =>
          dept.code.toLowerCase().includes(q) ||
          dept.name.toLowerCase().includes(q) ||
          (dept.description && dept.description.toLowerCase().includes(q))
      );
    }
    result.sort((a, b) => {
      if (sortBy === "name") {
        return sortOrder === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      return sortOrder === "asc"
        ? a.code.localeCompare(b.code)
        : b.code.localeCompare(a.code);
    });
    return result;
  }, [departmentsQuery.data?.departments, search, sortBy, sortOrder]);

  const columns: ColumnDef<Department>[] = useMemo(
    () => [
      {
        accessorKey: "code",
        header: "Code",
        enableSorting: true,
        meta: {
          sortKey: "code",
          width: "120px",
        },
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold">{row.original.code}</span>
        ),
      },
      {
        accessorKey: "name",
        header: "Department Name",
        enableSorting: true,
        meta: {
          sortKey: "name",
          className: "font-medium",
        },
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <span className="text-muted-foreground line-clamp-1">
            {row.original.description || "—"}
          </span>
        ),
        meta: {
          exportValue: (dept) => dept.description || "",
        },
      },
      {
        accessorKey: "isActive",
        id: "status",
        header: "Status",
        meta: {
          align: "right",
          exportValue: (dept) => (dept.isActive ? "Active" : "Inactive"),
        },
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Badge variant={row.original.isActive ? "secondary" : "outline"} className="text-xs">
              {row.original.isActive ? "Active" : "Inactive"}
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
        title="Academic Departments"
        description="Institution academic divisions and department codes."
      />

      <div className="space-y-4">
        <DataTableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search code or department name..."
          isFiltered={isFiltered}
          onClearFilters={resetFilters}
          onExportCsv={() => exportToCsv("academic-departments", columns, departments)}
          countSummary={`${departments.length} departments`}
        />

        <DataTable
          data={departments}
          columns={columns}
          loading={departmentsQuery.isLoading || departmentsQuery.isFetching}
          isError={departmentsQuery.isError}
          errorMessage={error?.message}
          onRetry={departmentsQuery.refetch}
          emptyTitle="No departments found"
          emptyDescription={
            isFiltered
              ? "No departments match your search."
              : "No academic departments have been recorded yet."
          }
          emptyIcon={Building2}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      </div>
    </div>
  );
}
