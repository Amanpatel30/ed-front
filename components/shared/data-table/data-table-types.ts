import type React from "react";
import type { LucideIcon } from "lucide-react";
import type { ColumnDef, RowData } from "@tanstack/react-table";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Additional Tailwind classes for the table body <td> cells. */
    className?: string;
    /** Additional Tailwind classes for the table header <th> cells. */
    headerClassName?: string;
    /** Cell text alignment. */
    align?: "left" | "center" | "right";
    /** Explicit column width or min-width (e.g. "120px", "15%"). */
    width?: string;
    /** Whether to exclude this column from CSV exports (e.g. actions column). */
    excludeFromExport?: boolean;
    /** Custom extractor for exporting to CSV. */
    exportValue?: (item: TData) => string | number | boolean | null | undefined;
    /** Backend property key to sort by. */
    sortKey?: string;
    /** Plain-text label for CSV headers or accessibility if header is a custom React component. */
    headerTitle?: string;
  }
}

export type { ColumnDef };

export interface DataTablePaginationProps {
  /** Current 1-based page number. */
  page: number;
  /** Number of rows per page. */
  pageSize: number;
  /** Total number of records across all pages. */
  total: number;
  /** Total number of pages. */
  totalPages: number;
  /** Page size options for the selector dropdown (defaults to [10, 20, 50, 100]). */
  pageSizeOptions?: number[];
  /** Singular or plural noun for the records (e.g. "course", "courses"). Defaults to "entries". */
  unit?: string;
  /** Callback when user changes the page (1-based). */
  onPageChange: (newPage: number) => void;
  /** Callback when user changes the rows-per-page. */
  onPageSizeChange: (newPageSize: number) => void;
}

export interface DataTableProps<TData> {
  /** Array of data rows to display. */
  data: TData[];
  /** TanStack ColumnDef definitions. */
  columns: ColumnDef<TData, unknown>[];
  /** Whether data is currently loading/fetching. */
  loading?: boolean;
  /** Whether an error occurred while loading. */
  isError?: boolean;
  /** Error message to display when isError is true. */
  errorMessage?: string;
  /** Callback to retry loading data when error occurs. */
  onRetry?: () => void;
  /** Empty state headline when data is empty and not loading. */
  emptyTitle?: string;
  /** Empty state detailed explanation. */
  emptyDescription?: string;
  /** Custom Lucide icon for empty state. */
  emptyIcon?: LucideIcon;
  /** Optional action button / link to display inside the empty state. */
  emptyAction?: React.ReactNode;
  /** Pagination controls configuration. Omit to hide pagination. */
  pagination?: DataTablePaginationProps;
  /** Active sort key (matches `sortKey` or `id` of the sorted column). */
  sortBy?: string;
  /** Active sort direction. */
  sortOrder?: "asc" | "desc";
  /** Callback when user clicks a sortable column header. */
  onSort?: (columnKey: string) => void;
  /** Optional click handler for table rows. */
  onRowClick?: (item: TData, index: number) => void;
  /** Optional callback to return custom classes for a specific row. */
  rowClassName?: (item: TData, index: number) => string;
  /** Additional container classes. */
  className?: string;
  /** Whether rows should alternate background colors (zebra striping). */
  striped?: boolean;
  /** Whether rows should highlight on hover (defaults to true). */
  hoverable?: boolean;
  /** Minimum container height to prevent layout shifts. */
  minHeight?: string;
  /** Whether pagination is managed manually/server-side (defaults to true). */
  manualPagination?: boolean;
  /** Whether sorting is managed manually/server-side (defaults to true). */
  manualSorting?: boolean;
}
