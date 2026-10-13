import type React from "react";
import type { LucideIcon } from "lucide-react";

export interface TableColumn<T = object> {
  /** Unique key identifying this column, typically corresponding to a property on T. */
  key: string;
  /** Header label or custom header element. */
  header: React.ReactNode;
  /** Custom render function for cell content. Receives the row item and row index. */
  render?: (item: T, index: number) => React.ReactNode;
  /** Whether this column can be sorted. */
  sortable?: boolean;
  /** Backend property key to sort by. Defaults to `key` if omitted. */
  sortKey?: string;
  /** Additional Tailwind classes for the table body <td> cells. */
  className?: string;
  /** Additional Tailwind classes for the table header <th> cells. */
  headerClassName?: string;
  /** Explicit column width or min-width (e.g. "120px", "15%"). */
  width?: string;
  /** Cell text alignment. */
  align?: "left" | "center" | "right";
  /** Whether to exclude this column from CSV exports (e.g. actions column). */
  excludeFromExport?: boolean;
  /** Custom extractor for exporting to CSV. */
  exportValue?: (item: T) => string | number | boolean | null | undefined;
}

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
  /** Callback when user changes the page. */
  onPageChange: (newPage: number) => void;
  /** Callback when user changes the rows-per-page. */
  onPageSizeChange: (newPageSize: number) => void;
}

export interface DataTableProps<T = object> {
  /** Array of data rows to display. */
  data: T[];
  /** Column definitions. */
  columns: TableColumn<T>[];
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
  /** Active sort key (matches `sortKey` or `key` of the sorted column). */
  sortBy?: string;
  /** Active sort direction. */
  sortOrder?: "asc" | "desc";
  /** Callback when user clicks a sortable column header. */
  onSort?: (columnKey: string) => void;
  /** Optional click handler for table rows. */
  onRowClick?: (item: T, index: number) => void;
  /** Optional callback to return custom classes for a specific row. */
  rowClassName?: (item: T, index: number) => string;
  /** Additional container classes. */
  className?: string;
  /** Whether rows should alternate background colors (zebra striping). */
  striped?: boolean;
  /** Whether rows should highlight on hover (defaults to true). */
  hoverable?: boolean;
  /** Minimum container height to prevent layout shifts. */
  minHeight?: string;
}
