"use client";

import * as React from "react";
import { Download, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DataTableToolbarProps {
  /** Current search input value. */
  search?: string;
  /** Handler when user types in search input. */
  onSearchChange?: (value: string) => void;
  /** Search placeholder text. */
  searchPlaceholder?: string;
  /** Custom filter components (Selects, tabs, chips). */
  filters?: React.ReactNode;
  /** Action elements on the right (e.g. "New" button). */
  actions?: React.ReactNode;
  /** Handler called when user clicks "Clear all filters". */
  onClearFilters?: () => void;
  /** Whether search or any filter is actively applied. */
  isFiltered?: boolean;
  /** Optional handler to trigger CSV export. */
  onExportCsv?: () => void;
  /** Label for the export button (defaults to "Export CSV"). */
  exportLabel?: string;
  /** Optional summary string, e.g. "12 of 48 courses". */
  countSummary?: string;
  /** Container className. */
  className?: string;
}

export function DataTableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters,
  actions,
  onClearFilters,
  isFiltered = false,
  onExportCsv,
  exportLabel = "Export CSV",
  countSummary,
  className,
}: DataTableToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex flex-1 flex-wrap items-center gap-3">
        {onSearchChange && (
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={search ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 pl-8 pr-8 text-sm"
              aria-label={searchPlaceholder}
            />
            {search ? (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            ) : null}
          </div>
        )}

        {filters}

        {isFiltered && onClearFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-9 text-xs"
          >
            <X className="size-3.5 mr-1" aria-hidden />
            Clear
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto">
        {countSummary && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {countSummary}
          </span>
        )}

        {onExportCsv && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExportCsv}
            className="h-9 text-xs"
          >
            <Download className="size-3.5 mr-1" aria-hidden />
            {exportLabel}
          </Button>
        )}

        {actions}
      </div>
    </div>
  );
}

