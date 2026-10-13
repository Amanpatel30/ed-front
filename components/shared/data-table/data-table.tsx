"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CircleAlert,
  Inbox,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableSkeleton } from "./data-table-skeleton";
import type { DataTableProps, TableColumn } from "./data-table-types";

export function DataTable<T extends object>({
  data,
  columns,
  loading = false,
  isError = false,
  errorMessage = "Failed to load records. Please try again.",
  onRetry,
  emptyTitle = "No records found",
  emptyDescription = "There are no entries matching your criteria.",
  emptyIcon: EmptyIcon = Inbox,
  emptyAction,
  pagination,
  sortBy,
  sortOrder,
  onSort,
  onRowClick,
  rowClassName,
  className,
  striped = false,
  hoverable = true,
  minHeight = "280px",
}: DataTableProps<T>) {
  const getSortIcon = (column: TableColumn<T>) => {
    const key = column.sortKey || column.key;
    if (sortBy !== key) {
      return (
        <ArrowUpDown
          className="size-3.5 opacity-40 transition-opacity group-hover:opacity-100"
          aria-hidden
        />
      );
    }
    if (sortOrder === "asc") {
      return <ArrowUp className="size-3.5 text-primary" aria-hidden />;
    }
    return <ArrowDown className="size-3.5 text-primary" aria-hidden />;
  };

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden",
        className
      )}
    >
      <div
        className="w-full overflow-x-auto"
        style={{ minHeight }}
      >
        <table
          className="w-full caption-bottom text-sm"
          aria-busy={loading ? "true" : "false"}
        >
          <thead>
            <tr className="border-b bg-muted/40 transition-colors">
              {columns.map((column) => {
                const alignClass =
                  column.align === "right"
                    ? "text-right justify-end"
                    : column.align === "center"
                    ? "text-center justify-center"
                    : "text-left justify-start";

                return (
                  <th
                    key={column.key}
                    className={cn(
                      "h-10 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                      column.headerClassName
                    )}
                    style={
                      column.width
                        ? { width: column.width, minWidth: column.width }
                        : undefined
                    }
                  >
                    {column.sortable && onSort ? (
                      <button
                        type="button"
                        onClick={() => onSort(column.sortKey || column.key)}
                        className={cn(
                          "group flex items-center gap-1.5 py-1 text-xs font-semibold uppercase tracking-wider transition-colors hover:text-foreground",
                          alignClass,
                          loading && "cursor-not-allowed opacity-50"
                        )}
                        disabled={loading}
                        aria-label={`Sort by ${String(column.header)}`}
                      >
                        <span className="truncate">{column.header}</span>
                        {getSortIcon(column)}
                      </button>
                    ) : (
                      <div className={cn("flex items-center", alignClass)}>
                        <span className="truncate">{column.header}</span>
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {loading ? (
              <DataTableSkeleton
                columns={columns}
                rows={pagination?.pageSize ?? 5}
              />
            ) : isError ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-14 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                      <CircleAlert className="size-5" aria-hidden />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        Failed to load data
                      </p>
                      <p className="mx-auto max-w-sm text-xs text-muted-foreground">
                        {errorMessage}
                      </p>
                    </div>
                    {onRetry && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onRetry}
                        className="mt-1"
                      >
                        <RefreshCw className="size-3.5" aria-hidden />
                        Try again
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-14 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <EmptyIcon className="size-5" aria-hidden />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        {emptyTitle}
                      </p>
                      {emptyDescription && (
                        <p className="mx-auto max-w-sm text-xs text-muted-foreground">
                          {emptyDescription}
                        </p>
                      )}
                    </div>
                    {emptyAction && <div className="mt-2">{emptyAction}</div>}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, rowIndex) => {
                const row = item as Record<string, unknown>;
                const rowId = String(row.id ?? rowIndex);

                return (
                  <tr
                    key={rowId}
                    className={cn(
                      "border-b transition-colors",
                      striped && rowIndex % 2 === 1 && "bg-muted/15",
                      hoverable && "hover:bg-muted/40",
                      onRowClick && "cursor-pointer",
                      rowClassName?.(item, rowIndex)
                    )}
                    onClick={() => onRowClick?.(item, rowIndex)}
                  >
                    {columns.map((column, colIndex) => {
                      const alignClass =
                        column.align === "right"
                          ? "text-right"
                          : column.align === "center"
                          ? "text-center"
                          : "text-left";

                      return (
                        <td
                          key={`${column.key}-${colIndex}`}
                          className={cn(
                            "p-4 align-middle text-sm",
                            alignClass,
                            column.className
                          )}
                          style={
                            column.width
                              ? { width: column.width, minWidth: column.width }
                              : undefined
                          }
                        >
                          {column.render
                            ? column.render(item, rowIndex)
                            : (row[column.key] as React.ReactNode)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <DataTablePagination {...pagination} loading={loading} />
      )}
    </div>
  );
}
