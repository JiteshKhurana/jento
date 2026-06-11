import { addDays, parseISO } from "date-fns";

export function parseTimeMinutes(
  timeStr: string | null | undefined,
): number | null {
  if (!timeStr) return null;
  const ampm = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
  if (ampm) {
    let h = parseInt(ampm[1]);
    const m = parseInt(ampm[2]);
    if (ampm[3].toLowerCase() === "pm" && h !== 12) h += 12;
    if (ampm[3].toLowerCase() === "am" && h === 12) h = 0;
    return h * 60 + m;
  }
  const h24 = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (h24) return parseInt(h24[1]) * 60 + parseInt(h24[2]);
  return null;
}

export function parseDurationMinutes(
  duration: string | null | undefined,
): number {
  if (!duration) return 60;
  let mins = 0;
  const h = duration.match(/([\d.]+)\s*h(?:our)?/i);
  const m = duration.match(/(\d+)\s*m(?:in)?/i);
  if (h) mins += Math.round(parseFloat(h[1]) * 60);
  if (m) mins += parseInt(m[1]);
  return mins || 60;
}

export function isLodgingType(type: string): boolean {
  const t = type.toLowerCase();
  return (
    t.includes("lodging") ||
    t.includes("hotel") ||
    t.includes("accommodation") ||
    t.includes("hostel") ||
    t.includes("airbnb") ||
    t.includes("resort") ||
    t.includes("hive") ||
    t.includes("stay")
  );
}

export function getDayDate(
  tripStartDate: string | null,
  dayNumber: number,
): Date | null {
  if (!tripStartDate) return null;
  return addDays(parseISO(tripStartDate), dayNumber - 1);
}

export function resolveExportDayDate(
  tripStartDate: string | null,
  dayNumber: number,
): Date {
  if (tripStartDate) {
    return addDays(parseISO(tripStartDate), dayNumber - 1);
  }
  return addDays(new Date(), dayNumber - 1);
}

export function applyTimeToDate(date: Date, minutesFromMidnight: number): Date {
  const result = new Date(date);
  result.setHours(
    Math.floor(minutesFromMidnight / 60),
    minutesFromMidnight % 60,
    0,
    0,
  );
  return result;
}
