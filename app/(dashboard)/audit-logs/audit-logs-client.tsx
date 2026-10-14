"use client";

import { useMemo } from "react";
import { History } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import {
  DataTable,
  DataTableToolbar,
  exportToCsv,
  type ColumnDef,
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
import { useAuditLogsQuery } from "@/lib/api/auditApi";
import { normalizeApiError } from "@/lib/api/error";
import { formatDate } from "@/lib/format";
import type { AuditLog } from "@/lib/types";

export default function AuditLogsClient() {
  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    search,
    setSearch,
    filters,
    setFilter,
    resetFilters,
    isFiltered,
  } = useTableQuery({
    initialPageSize: 5,
    initialFilters: { operation: "all" },
  });

  const trimmedSearch = search.trim();

  const auditQuery = useAuditLogsQuery({
    page,
    limit: pageSize,
    operation: filters.operation !== "all" ? filters.operation : undefined,
    search: trimmedSearch || undefined,
  });

  const error = normalizeApiError(auditQuery.error);
  const auditLogs = useMemo(
    () => auditQuery.data?.auditLogs ?? [],
    [auditQuery.data?.auditLogs]
  );
  const total = auditQuery.data?.total ?? auditQuery.data?.count ?? 0;
  const totalPages =
    auditQuery.data?.totalPages ?? Math.max(1, Math.ceil(total / pageSize));

  const columns: ColumnDef<AuditLog>[] = useMemo(
    () => [
      {
        accessorKey: "createdAt",
        header: "Timestamp",
        meta: {
          width: "180px",
          exportValue: (log) => formatDate(log.createdAt),
        },
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        accessorKey: "operation",
        header: "Action / Operation",
        cell: ({ row }) => {
          let variant: "default" | "secondary" | "outline" | "destructive" = "secondary";
          const op = row.original.operation?.toUpperCase() ?? "";
          if (op.includes("DELETE") || op.includes("DROP") || op.includes("DEACTIVATE")) {
            variant = "destructive";
          } else if (op.includes("CREATE") || op.includes("OPEN")) {
            variant = "default";
          }
          return (
            <Badge variant={variant} className="font-mono text-[10px] tracking-wide">
              {row.original.operation}
            </Badge>
          );
        },
      },
      {
        id: "admin",
        header: "Administrator",
        accessorFn: (log) => log.admin?.email ?? "System",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-foreground text-xs">
              {row.original.admin?.name ?? "System"}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {row.original.admin?.email ?? ""}
            </span>
          </div>
        ),
        meta: {
          exportValue: (log) => log.admin?.email ?? "System",
        },
      },
      {
        accessorKey: "targetType",
        header: "Target Entity",
        cell: ({ row }) => (
          <span className="text-xs font-mono text-muted-foreground">
            {row.original.targetType ?? "—"}
          </span>
        ),
        meta: {
          exportValue: (log) => log.targetType ?? "",
        },
      },
      {
        accessorKey: "targetId",
        header: "Record ID",
        meta: {
          align: "right",
          className: "tabular-nums text-right font-mono text-xs",
          exportValue: (log) => log.targetId ?? "",
        },
        cell: ({ row }) => (
          <span>{row.original.targetId ?? "—"}</span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institutional Audit Trail"
        description="Immutable record of administrative operations and database changes."
      />

      <div className="space-y-4">
        <DataTableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search audit trail..."
          isFiltered={isFiltered}
          onClearFilters={resetFilters}
          onExportCsv={() => exportToCsv("audit-logs", columns, auditLogs)}
          countSummary={
            total > 0
              ? `${auditLogs.length} of ${total} records`
              : undefined
          }
          filters={
            <Select
              items={{
                all: "All operations",
                CREATE: "Creation",
                UPDATE: "Updates",
                DELETE: "Deletions",
              }}
              value={filters.operation}
              onValueChange={(val) => setFilter("operation", String(val))}
            >
              <SelectTrigger className="h-9 sm:w-44 text-sm" aria-label="Operation filter">
                <SelectValue placeholder="All operations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All operations</SelectItem>
                <SelectItem value="CREATE">CREATE</SelectItem>
                <SelectItem value="UPDATE">UPDATE</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        <DataTable
          data={auditLogs}
          columns={columns}
          loading={auditQuery.isLoading || auditQuery.isFetching}
          isError={auditQuery.isError}
          errorMessage={error?.message}
          onRetry={auditQuery.refetch}
          emptyTitle="No audit logs recorded"
          emptyDescription={
            isFiltered
              ? "No records match the selected operation."
              : "Administrative actions will appear here once executed."
          }
          emptyIcon={History}
          pagination={{
            page,
            pageSize,
            total,
            totalPages,
            pageSizeOptions: [15, 30, 50],
            unit: "records",
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
          }}
        />
      </div>
    </div>
  );
}
