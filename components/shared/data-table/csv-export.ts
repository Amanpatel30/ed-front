import type { TableColumn } from "./data-table-types";

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
 * Exports data to a CSV file in the browser using TableColumn definitions.
 */
export function exportToCsv<T extends object>(
  filename: string,
  columns: TableColumn<T>[],  
  data: T[]
): void {
  // Filter out columns explicitly excluded from export (like action buttons)
  const exportableColumns = columns.filter(
    (col) => !col.excludeFromExport && col.header && typeof col.header === "string"
  );

  if (exportableColumns.length === 0 || data.length === 0) {
    return;
  }

  // Header row
  const headerRow = exportableColumns
    .map((col) => escapeCsvValue(col.header))
    .join(",");

  // Data rows
  const dataRows = data.map((item) => {
    const row = item as Record<string, unknown>;
    return exportableColumns
      .map((col) => {
        if (col.exportValue) {
          return escapeCsvValue(col.exportValue(item));
        }
        const val = row[col.key];
        return escapeCsvValue(val);
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
