import type { ColumnDef } from "@tanstack/react-table";

/**
 * Cleanly escapes a string or value for inclusion in a CSV file.
 * Handles commas, double-quotes, and newlines per RFC 4180.
 */
function escapeCsvValue(val: unknown): string {
  if (val === null || val === undefined) {
    return "";
  }

  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Exports data to a CSV file in the browser using TanStack ColumnDef definitions.
 */
export function exportToCsv<TData extends object>(
  filename: string,
  columns: ColumnDef<TData, unknown>[],
  data: TData[]
): void {
  // Filter out columns explicitly excluded from export (like action buttons)
  const exportableColumns = columns.filter((col) => {
    if (col.meta?.excludeFromExport) return false;
    const colId = col.id ?? (col as { accessorKey?: string }).accessorKey;
    if (colId === "actions") return false;
    return true;
  });

  if (exportableColumns.length === 0 || data.length === 0) {
    return;
  }

  // Header row
  const headerRow = exportableColumns
    .map((col) => {
      let title = "";
      if (typeof col.header === "string") {
        title = col.header;
      } else if (typeof col.meta?.headerTitle === "string") {
        title = col.meta.headerTitle;
      } else if (col.id) {
        title = col.id;
      } else if ((col as { accessorKey?: string }).accessorKey) {
        title = String((col as { accessorKey?: string }).accessorKey);
      }
      return escapeCsvValue(title);
    })
    .join(",");

  // Data rows
  const dataRows = data.map((item) => {
    const record = item as Record<string, unknown>;
    return exportableColumns
      .map((col) => {
        if (col.meta?.exportValue) {
          return escapeCsvValue(col.meta.exportValue(item));
        }
        const accessorCol = col as unknown as { accessorFn?: (row: TData, index: number) => unknown };
        if (typeof accessorCol.accessorFn === "function") {
          return escapeCsvValue(accessorCol.accessorFn(item, 0));
        }
        const key = (col as { accessorKey?: string }).accessorKey || col.id;
        if (key && record[key] !== undefined) {
          return escapeCsvValue(record[key]);
        }
        return "";
      })
      .join(",");
  });

  const csvContent = [headerRow, ...dataRows].join("\r\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    filename.endsWith(".csv") ? filename : `${filename}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
