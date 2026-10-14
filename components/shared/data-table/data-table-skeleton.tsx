"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";

interface DataTableSkeletonProps<TData> {
  columns?: ColumnDef<TData, unknown>[];
  columnCount?: number;
  rows?: number;
}

export function DataTableSkeleton<TData>({
  columns,
  columnCount = columns?.length ?? 5,
  rows = 5,
}: DataTableSkeletonProps<TData>) {
  const count = columns?.length ?? columnCount;

  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr
          key={`skeleton-row-${rowIndex}`}
          className="border-b transition-colors"
        >
          {Array.from({ length: count }).map((_, colIndex) => {
            const column = columns?.[colIndex];
            const meta = column?.meta;
            const align = meta?.align ?? "left";
            const alignClass =
              align === "right"
                ? "text-right justify-end"
                : align === "center"
                ? "text-center justify-center"
                : "text-left justify-start";

            return (
              <td
                key={`skeleton-cell-${colIndex}`}
                className={cn("p-4 align-middle", meta?.className)}
                style={
                  meta?.width
                    ? { width: meta.width, minWidth: meta.width }
                    : undefined
                }
              >
                <div className={cn("flex items-center", alignClass)}>
                  <div
                    className={cn(
                      "h-4 animate-pulse rounded bg-muted",
                      colIndex === 0
                        ? "w-24"
                        : colIndex === 1
                        ? "w-44"
                        : colIndex === count - 1
                        ? "w-16"
                        : "w-28"
                    )}
                  />
                </div>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
