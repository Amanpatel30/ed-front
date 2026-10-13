"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/format";

/**
 * Rendered only when the API returned page metadata, which happens only when the
 * request carried `page` or `limit`.
 */
export function TablePagination({
  page,
  totalPages,
  total,
  unit,
  onPageChange,
  isFetching = false,
}: {
  page: number;
  totalPages: number;
  total?: number;
  /** Singular noun, e.g. "course". */
  unit: string;
  onPageChange: (page: number) => void;
  isFetching?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground tabular-nums">
        Page {page} of {totalPages}
        {typeof total === "number" ? ` · ${formatCount(total, unit)}` : null}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1 || isFetching}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft aria-hidden />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages || isFetching}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight aria-hidden />
        </Button>
      </div>
    </div>
  );
}
