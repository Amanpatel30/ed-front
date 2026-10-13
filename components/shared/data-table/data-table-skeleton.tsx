"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { TableColumn } from "./data-table-types";

interface DataTableSkeletonProps<T> {
  columns: TableColumn<T>[];
  rows?: number;
}

export function DataTableSkeleton<T>({
  columns,
  rows = 5,
}: DataTableSkeletonProps<T>) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr
          key={`skeleton-row-${rowIndex}`}
          className="border-b transition-colors"
        >
          {columns.map((column, colIndex) => {
            const alignClass =
              column.align === "right"
                ? "text-right justify-end"
                : column.align === "center"
                ? "text-center justify-center"
                : "text-left justify-start";

            return (
              <td
                key={`skeleton-cell-${colIndex}`}
                className={cn("p-4 align-middle", column.className)}
                style={
                  column.width
                    ? { width: column.width, minWidth: column.width }
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
                        : colIndex === columns.length - 1
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

