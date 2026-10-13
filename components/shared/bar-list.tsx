/**
 * Horizontal bar comparison for category data. Every bar is labelled and its
 * exact value is printed beside it, so the chart is readable without relying on
 * colour or length — no tooltip-only information and no fabricated values.
 *
 * A bar list is used instead of a charting dependency: it covers category
 * comparison, stays legible at narrow widths, and needs no canvas.
 */
"use client";

import { useId } from "react";

export function BarList({
  title,
  unit,
  data,
  emptyMessage = "Nothing to compare yet.",
}: {
  title: string;
  /** Unit shown next to each value, e.g. "enrollments". */
  unit: string;
  data: { label: string; value: number; caption?: string }[];
  emptyMessage?: string;
}) {
  const titleId = useId();
  const max = Math.max(0, ...data.map((row) => row.value));
  const total = data.reduce((sum, row) => sum + row.value, 0);

  return (
    <section aria-labelledby={titleId} className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id={titleId} className="text-sm font-medium">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground tabular-nums">
          {total} {unit} total
        </p>
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2.5">
          {data.map((row) => {
            const percentage = max > 0 ? (row.value / max) * 100 : 0;
            const width = row.value > 0 ? Math.max(percentage, 2) : 0;

            return (
              <li key={row.label} className="space-y-1">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate">{row.label}</span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {row.value} {unit}
                  </span>
                </div>
                <div
                  className="h-2 w-full overflow-hidden rounded-full bg-muted"
                  aria-hidden
                >
                  <div
                    className="h-full rounded-full bg-chart-1"
                    style={{ width: `${width}%` }}
                  />
                </div>
                {row.caption ? (
                  <p className="text-xs text-muted-foreground">{row.caption}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
