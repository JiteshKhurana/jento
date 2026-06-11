import type { ActivityItem } from "@/lib/ai/schemas";
import { parseDurationMinutes, parseTimeMinutes } from "@/lib/itinerary/time-utils";

const DEFAULT_DURATION: Record<ActivityItem["type"], string> = {
  activity: "2h",
  food: "1h",
  lodging: "1h",
  transport: "1h 30m",
};

const MIN_START_MINUTES = 7 * 60;
const DEFAULT_DAY_START = 9 * 60;
const GAP_MINUTES = 30;

export function formatTimeMinutes(minutes: number): string {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

export function defaultDurationForType(type: ActivityItem["type"]): string {
  return DEFAULT_DURATION[type] ?? "1h";
}

function inferFoodTimeMinutes(title: string, mealIndex: number): number {
  const t = title.toLowerCase();
  if (/\bbreakfast\b/.test(t)) return 8 * 60;
  if (/\bbrunch\b/.test(t)) return 10 * 60 + 30;
  if (/\blunch\b/.test(t)) return 12 * 60 + 30;
  if (/\bdinner\b|\bsupper\b/.test(t)) return 19 * 60;
  const slots = [8 * 60, 12 * 60 + 30, 19 * 60];
  return slots[mealIndex % slots.length];
}

function inferDefaultStartMinutes(
  item: ActivityItem,
  index: number,
  cursor: number,
  foodIndex: number,
): number {
  if (item.type === "lodging") return 15 * 60;
  if (item.type === "food") return inferFoodTimeMinutes(item.title, foodIndex);
  if (item.type === "transport" && index === 0) return 7 * 60;
  return Math.max(cursor, DEFAULT_DAY_START);
}

export function normalizeDayItemTimes(items: ActivityItem[]): ActivityItem[] {
  let cursor = DEFAULT_DAY_START;
  let foodIndex = 0;

  return items.map((item, index) => {
    let startMins = parseTimeMinutes(item.startTime);

    if (startMins === null) {
      const inferred = inferDefaultStartMinutes(
        item,
        index,
        cursor,
        foodIndex,
      );
      startMins = Math.max(inferred, MIN_START_MINUTES);
      if (index > 0 && startMins < cursor) {
        startMins = cursor;
      }
      if (item.type === "food") foodIndex += 1;
    } else if (item.type === "food") {
      foodIndex += 1;
    }

    const duration =
      item.duration?.trim() || defaultDurationForType(item.type);
    const durMins = parseDurationMinutes(duration);
    cursor = startMins + durMins + GAP_MINUTES;

    return {
      ...item,
      startTime: formatTimeMinutes(startMins),
      duration,
    };
  });
}

export function suggestStartTimeForNewItem(
  existingItems: Array<{
    type: string;
    title: string;
    startTime?: string | null;
    duration?: string | null;
    sortOrder?: number;
  }>,
  newItem: { type: string; title: string },
): { startTime: string; duration: string } {
  const sorted = [...existingItems].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );

  let cursor = DEFAULT_DAY_START;
  for (const item of sorted) {
    const start = parseTimeMinutes(item.startTime);
    if (start === null) continue;
    const dur = parseDurationMinutes(item.duration);
    cursor = Math.max(cursor, start + dur + GAP_MINUTES);
  }

  const activityType = newItem.type.toLowerCase() as ActivityItem["type"];
  const draftItem: ActivityItem = {
    type: activityType,
    title: newItem.title,
  };
  const inferred = inferDefaultStartMinutes(
    draftItem,
    sorted.length,
    cursor,
    sorted.filter((i) => i.type.toLowerCase() === "food").length,
  );
  const startMins = Math.max(inferred, cursor, MIN_START_MINUTES);

  return {
    startTime: formatTimeMinutes(startMins),
    duration: defaultDurationForType(activityType),
  };
}

export function toActivityItem(item: {
  type: string;
  title: string;
  description?: string | null;
  startTime?: string | null;
  duration?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  googlePlaceId?: string | null;
}): ActivityItem {
  const normalizedType = item.type.toLowerCase();
  const type = (
    ["activity", "food", "lodging", "transport"].includes(normalizedType)
      ? normalizedType
      : "activity"
  ) as ActivityItem["type"];

  return {
    type,
    title: item.title,
    description: item.description ?? undefined,
    startTime: item.startTime ?? undefined,
    duration: item.duration ?? undefined,
    latitude: item.latitude ?? undefined,
    longitude: item.longitude ?? undefined,
    googlePlaceId: item.googlePlaceId ?? undefined,
  };
}

export function resolveDayItemSchedules<
  T extends {
    id: string;
    type: string;
    title: string;
    description?: string | null;
    startTime?: string | null;
    duration?: string | null;
    sortOrder: number;
  },
>(items: T[]): Map<string, { startTime: string; duration: string }> {
  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
  const normalized = normalizeDayItemTimes(sorted.map(toActivityItem));

  return new Map(
    sorted.map((item, index) => [
      item.id,
      {
        startTime: normalized[index].startTime!,
        duration: normalized[index].duration!,
      },
    ]),
  );
}
