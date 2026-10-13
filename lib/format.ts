const DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const EMPTY = "—";

/**
 * The API returns DATEONLY columns as `YYYY-MM-DD` and timestamps as ISO
 * strings. Parsing a bare `YYYY-MM-DD` with `new Date()` treats it as UTC
 * midnight, which renders as the previous day in western time zones, so date-only
 * values are parsed as local time instead.
 */
function toDate(value: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return EMPTY;

  const date = toDate(value);

  return Number.isNaN(date.getTime()) ? EMPTY : DATE_FORMATTER.format(date);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return EMPTY;

  const date = toDate(value);

  return Number.isNaN(date.getTime()) ? EMPTY : DATE_TIME_FORMATTER.format(date);
}

export function formatCount(value: number, singular: string): string {
  return `${value} ${value === 1 ? singular : `${singular}s`}`;
}
