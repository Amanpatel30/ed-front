"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
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
import type { DataTableProps } from "./data-table-types";

export function DataTable<TData>({
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
  manualPagination = true,
  manualSorting = true,
}: DataTableProps<TData>) {
  // Sync pagination state:
  // TanStack table uses 0-based pageIndex, while the EduCore API / pagination prop uses 1-based page.
  const [paginationState, setPaginationState] = React.useState<PaginationState>(() => ({
    pageIndex: pagination ? Math.max(0, pagination.page - 1) : 0,
    pageSize: pagination?.pageSize ?? Math.max(1, data.length),
  }));

  const paginationPage = pagination?.page;
  const paginationPageSize = pagination?.pageSize;

  React.useEffect(() => {
    if (paginationPage !== undefined && paginationPageSize !== undefined) {
      setPaginationState({
        pageIndex: Math.max(0, paginationPage - 1),
        pageSize: paginationPageSize,
      });
    }
  }, [paginationPage, paginationPageSize]);

  // Sync sorting state with sortBy and sortOrder props
  const sortingState = React.useMemo<SortingState>(() => {
    if (!sortBy) return [];
    return [{ id: sortBy, desc: sortOrder === "desc" }];
  }, [sortBy, sortOrder]);

  const table = useReactTable({
    data,
    columns,
    pageCount: pagination?.totalPages ?? -1,
    state: {
      pagination: paginationState,
      sorting: sortingState,
    },
    manualPagination,
    manualSorting,
    getCoreRowModel: getCoreRowModel(),
    ...(manualSorting ? {} : { getSortedRowModel: getSortedRowModel() }),
    ...(manualPagination ? {} : { getPaginationRowModel: getPaginationRowModel() }),
    onPaginationChange: (updater) => {
      const nextState = typeof updater === "function" ? updater(paginationState) : updater;
      setPaginationState(nextState);
      if (pagination) {
        if (nextState.pageSize !== pagination.pageSize) {
          pagination.onPageSizeChange(nextState.pageSize);
        } else if (nextState.pageIndex + 1 !== pagination.page) {
          pagination.onPageChange(nextState.pageIndex + 1);
        }
      }
    },
  });

  const getSortIcon = (canSort: boolean, isSorted: false | "asc" | "desc") => {
    if (!canSort) return null;
    if (!isSorted) {
      return (
        <ArrowUpDown
          className="size-3.5 opacity-40 transition-opacity group-hover:opacity-100"
          aria-hidden
        />
      );
    }
    if (isSorted === "asc") {
      return <ArrowUp className="size-3.5 text-primary" aria-hidden />;
    }
    return <ArrowDown className="size-3.5 text-primary" aria-hidden />;
  };

  const visibleColumnsCount = table.getVisibleLeafColumns().length;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden",
        className
      )}
    >
      <div className="w-full overflow-x-auto" style={{ minHeight }}>
        <table
          className="w-full caption-bottom text-sm"
          aria-busy={loading ? "true" : "false"}
        >
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b bg-muted/40 transition-colors">
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta;
                  const align = meta?.align ?? "left";
                  const alignClass =
                    align === "right"
                      ? "text-right justify-end"
                      : align === "center"
                      ? "text-center justify-center"
                      : "text-left justify-start";

                  const canSort = header.column.getCanSort();
                  const isSorted = header.column.getIsSorted();

                  const handleSortClick = () => {
                    if (onSort) {
                      onSort(meta?.sortKey || header.column.id);
                    } else if (header.column.getToggleSortingHandler()) {
                      header.column.getToggleSortingHandler()?.({});
                    }
                  };

                  return (
                    <th
                      key={header.id}
                      className={cn(
                        "h-10 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                        meta?.headerClassName
                      )}
                      style={
                        meta?.width
                          ? { width: meta.width, minWidth: meta.width }
                          : undefined
                      }
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={handleSortClick}
                          className={cn(
                            "group flex items-center gap-1.5 py-1 text-xs font-semibold uppercase tracking-wider transition-colors hover:text-foreground",
                            alignClass,
                            loading && "cursor-not-allowed opacity-50"
                          )}
                          disabled={loading}
                          aria-label={`Sort by ${String(meta?.headerTitle ?? header.column.id)}`}
                        >
                          <span className="truncate">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          {getSortIcon(canSort, isSorted)}
                        </button>
                      ) : (
                        <div className={cn("flex items-center", alignClass)}>
                          <span className="truncate">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-border/60">
            {loading ? (
              <DataTableSkeleton
                columns={columns}
                columnCount={visibleColumnsCount}
                rows={pagination?.pageSize ?? 5}
              />
            ) : isError ? (
              <tr>
                <td colSpan={visibleColumnsCount} className="px-4 py-14 text-center">
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
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={visibleColumnsCount} className="px-4 py-14 text-center">
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
              table.getRowModel().rows.map((row, rowIndex) => {
                const item = row.original;
                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b transition-colors",
                      striped && rowIndex % 2 === 1 && "bg-muted/15",
                      hoverable && "hover:bg-muted/40",
                      onRowClick && "cursor-pointer",
                      rowClassName?.(item, rowIndex)
                    )}
                    onClick={() => onRowClick?.(item, rowIndex)}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const meta = cell.column.columnDef.meta;
                      const align = meta?.align ?? "left";
                      const alignClass =
                        align === "right"
                          ? "text-right"
                          : align === "center"
                          ? "text-center"
                          : "text-left";

                      return (
                        <td
                          key={cell.id}
                          className={cn(
                            "p-4 align-middle text-sm",
                            alignClass,
                            meta?.className
                          )}
                          style={
                            meta?.width
                              ? { width: meta.width, minWidth: meta.width }
                              : undefined
                          }
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
