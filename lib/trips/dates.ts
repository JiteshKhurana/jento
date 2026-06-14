import { differenceInCalendarDays, format, startOfDay } from "date-fns";

export const MAX_TRIP_DAYS = 20;

/** Serialize a local calendar date as UTC midnight (YYYY-MM-DDT00:00:00.000Z). */
export function toCalendarDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}T00:00:00.000Z`;
}

function calendarDateFromParts(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m, d));
}

/**
 * Normalize trip dates to UTC midnight on the intended calendar day.
 * Handles new YYYY-MM-DD payloads and legacy local-midnight toISOString values.
 */
export function parseTripDate(
  value: string | Date | null | undefined,
): Date | null {
  if (!value) return null;

  if (typeof value === "string") {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return calendarDateFromParts(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),
      );
    }
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const isUtcMidnight =
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0;
  if (isUtcMidnight) return date;

  // Legacy: date picker local midnight encoded via toISOString (e.g. IST → prior UTC evening).
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();
  if (date.getUTCHours() >= 12) {
    return calendarDateFromParts(y, m, d + 1);
  }
  return calendarDateFromParts(y, m, d);
}

/** Format a trip date as YYYY-MM-DD for booking URLs and APIs. */
export function formatCalendarDateISO(date: Date): string {
  const normalized = parseTripDate(date) ?? date;
  const y = normalized.getUTCFullYear();
  const m = String(normalized.getUTCMonth() + 1).padStart(2, "0");
  const d = String(normalized.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getExpectedTripDayCount(
  startDate?: Date | null,
  endDate?: Date | null,
  preferences?: unknown,
): number | null {
  const start = startDate ? parseTripDate(startDate) : null;
  const end = endDate ? parseTripDate(endDate) : null;
  if (start && end) {
    return differenceInCalendarDays(startOfDay(end), startOfDay(start)) + 1;
  }

  const prefs = preferences as
    | { flexibleDays?: number | null; timingMode?: string }
    | undefined;
  if (
    prefs?.timingMode === "flexible" &&
    prefs.flexibleDays &&
    prefs.flexibleDays > 0
  ) {
    return prefs.flexibleDays;
  }

  return null;
}

export function formatTripDateRange(startDate: Date, endDate: Date): string {
  const start = parseTripDate(startDate) ?? startDate;
  const end = parseTripDate(endDate) ?? endDate;
  const startLabel = format(start, "MMM d, yyyy");
  const endLabel = format(end, "MMM d, yyyy");
  return startLabel === endLabel
    ? startLabel
    : `${startLabel} – ${endLabel}`;
}

export function validateItineraryDayCount(
  dayCount: number,
  startDate?: Date | null,
  endDate?: Date | null,
  preferences?: unknown,
): void {
  const expected = getExpectedTripDayCount(startDate, endDate, preferences);
  if (expected !== null && dayCount !== expected) {
    throw new Error(
      `Itinerary must have exactly ${expected} days (one per calendar day from start to end date, inclusive). Got ${dayCount} days.`,
    );
  }
}
