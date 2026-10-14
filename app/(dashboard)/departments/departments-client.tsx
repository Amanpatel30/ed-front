"use client";

import { useMemo } from "react";
import { Building2 } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import {
  DataTable,
  DataTableToolbar,
  exportToCsv,
  type TableColumn,
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

  const columns: TableColumn<Department>[] = useMemo(
    () => [
      {
        key: "code",
        header: "Code",
        sortable: true,
        sortKey: "code",
        width: "120px",
        render: (dept) => (
          <span className="font-mono text-xs font-semibold">{dept.code}</span>
        ),
      },
      {
        key: "name",
        header: "Department Name",
        sortable: true,
        sortKey: "name",
        className: "font-medium",
      },
      {
        key: "description",
        header: "Description",
        render: (dept) => (
          <span className="text-muted-foreground line-clamp-1">
            {dept.description || "—"}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        align: "right",
        render: (dept) => (
          <div className="flex justify-end">
            <Badge variant={dept.isActive ? "secondary" : "outline"} className="text-xs">
              {dept.isActive ? "Active" : "Inactive"}
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
