import type {
  ItineraryDayData,
  ItineraryItemData,
} from "@/components/itinerary/day-timeline";
import { resolveDayItemSchedules } from "@/lib/itinerary/item-times";
import {
  applyTimeToDate,
  resolveExportDayDate,
  parseDurationMinutes,
  parseTimeMinutes,
} from "@/lib/itinerary/time-utils";

type ExportIcsOptions = {
  tripTitle: string;
  tripId: string;
  destination: string;
  tripStartDate: string | null;
  days: ItineraryDayData[];
};

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function formatIcsUtcStamp(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

function formatIcsLocalDateTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}

function formatIcsDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

function foldLine(line: string): string {
  const chunks: string[] = [];
  let remaining = line;
  chunks.push(remaining.slice(0, 75));
  remaining = remaining.slice(75);
  while (remaining.length > 0) {
    chunks.push(` ${remaining.slice(0, 74)}`);
    remaining = remaining.slice(74);
  }
  return chunks.join("\r\n");
}

function buildEventLines(
  item: ItineraryItemData,
  day: ItineraryDayData,
  options: ExportIcsOptions,
): string[] {
  const dayDate = resolveExportDayDate(options.tripStartDate, day.dayNumber);
  const schedule = resolveDayItemSchedules(day.items).get(item.id);
  const startMins = parseTimeMinutes(schedule?.startTime ?? item.startTime);
  const durMins = parseDurationMinutes(schedule?.duration ?? item.duration);

  const lines = [
    "BEGIN:VEVENT",
    `UID:${item.id}@${options.tripId}`,
    `DTSTAMP:${formatIcsUtcStamp(new Date())}`,
    `SUMMARY:${escapeIcsText(item.title)}`,
  ];

  if (startMins !== null) {
    const start = applyTimeToDate(dayDate, startMins);
    const end = applyTimeToDate(dayDate, startMins + durMins);
    lines.push(`DTSTART:${formatIcsLocalDateTime(start)}`);
    lines.push(`DTEND:${formatIcsLocalDateTime(end)}`);
  }

  const location =
    item.placeCache?.address?.trim() ||
    item.placeCache?.name?.trim() ||
    null;
  if (location) {
    lines.push(`LOCATION:${escapeIcsText(location)}`);
  }

  const descriptionParts = [
    item.description?.trim(),
    schedule?.startTime ?? item.startTime
      ? `Time: ${schedule?.startTime ?? item.startTime}`
      : null,
    schedule?.duration ?? item.duration
      ? `Duration: ${schedule?.duration ?? item.duration}`
      : null,
    day.title ? `Day ${day.dayNumber}: ${day.title}` : `Day ${day.dayNumber}`,
  ].filter(Boolean);

  if (descriptionParts.length > 0) {
    lines.push(`DESCRIPTION:${escapeIcsText(descriptionParts.join("\n"))}`);
  }

  if (item.bookingUrl) {
    lines.push(`URL:${item.bookingUrl}`);
  }

  lines.push("END:VEVENT");
  return lines;
}

export function buildItineraryIcs(options: ExportIcsOptions): string {
  const events = options.days.flatMap((day) =>
    day.items.map((item) => buildEventLines(item, day, options)),
  );

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Tripzy//Itinerary//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(options.tripTitle)}`,
    ...events.flat(),
    "END:VCALENDAR",
  ];

  return lines.map(foldLine).join("\r\n") + "\r\n";
}
