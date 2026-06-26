"use client";

import { useMemo, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Car,
  BedDouble,
  Star,
  UtensilsCrossed,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeIllustration } from "@/components/ui/theme-illustration";
import type {
  ItineraryDayData,
  ItineraryItemData,
} from "@/components/itinerary/day-timeline";
import { resolveDayItemSchedules } from "@/lib/itinerary/item-times";

// ── Layout constants ─────────────────────────────────────────────────────────

const HOUR_HEIGHT = 60; // px per hour slot
const START_HOUR = 7; // 7 am
const END_HOUR = 22; // 10 pm
const TOTAL_HOURS = END_HOUR - START_HOUR;
const HOURS = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);
const DAYS_PER_VIEW = 4;

// ── Event style by item type ─────────────────────────────────────────────────

type EventStyle = {
  bg: string;
  border: string;
  text: string;
  Icon: React.ComponentType<{ className?: string }>;
};

function getEventStyle(type: string): EventStyle {
  const t = type.toLowerCase();
  if (
    t.includes("transport") ||
    t.includes("flight") ||
    t.includes("train") ||
    t.includes("drive") ||
    t.includes("transit") ||
    t.includes("bus") ||
    t.includes("taxi") ||
    t.includes("transfer")
  ) {
    return {
      bg: "bg-rose-50",
      border: "border-rose-200",
      text: "text-rose-700",
      Icon: Car,
    };
  }
  if (
    t.includes("lodging") ||
    t.includes("hotel") ||
    t.includes("accommodation") ||
    t.includes("hostel") ||
    t.includes("airbnb") ||
    t.includes("resort") ||
    t.includes("stay") ||
    t.includes("hive")
  ) {
    return {
      bg: "bg-violet-50",
      border: "border-violet-200",
      text: "text-violet-700",
      Icon: BedDouble,
    };
  }
  if (
    t.includes("restaurant") ||
    t.includes("food") ||
    t.includes("cafe") ||
    t.includes("bar") ||
    t.includes("dining") ||
    t.includes("lunch") ||
    t.includes("dinner") ||
    t.includes("breakfast")
  ) {
    return {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-700",
      Icon: UtensilsCrossed,
    };
  }
  if (
    t.includes("activity") ||
    t.includes("beach") ||
    t.includes("museum") ||
    t.includes("park") ||
    t.includes("tour") ||
    t.includes("attraction") ||
    t.includes("sight") ||
    t.includes("temple") ||
    t.includes("fort")
  ) {
    return {
      bg: "bg-teal-50",
      border: "border-teal-200",
      text: "text-teal-700",
      Icon: Star,
    };
  }
  return {
    bg: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-700",
    Icon: MapPin,
  };
}

// ── Time parsing utilities ────────────────────────────────────────────────────

function parseTimeMinutes(timeStr: string | null | undefined): number | null {
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

function parseDurationMinutes(duration: string | null | undefined): number {
  if (!duration) return 60;
  let mins = 0;
  const h = duration.match(/([\d.]+)\s*h(?:our)?/i);
  const m = duration.match(/(\d+)\s*m(?:in)?/i);
  if (h) mins += Math.round(parseFloat(h[1]) * 60);
  if (m) mins += parseInt(m[1]);
  return mins || 60;
}

// ── Component ─────────────────────────────────────────────────────────────────

type CalEvent = {
  item: ItineraryItemData;
  colIdx: number;
  startMins: number;
  durMins: number;
  displayStartTime: string;
  displayDuration: string;
};

type TripCalendarProps = {
  days: ItineraryDayData[];
  tripStartDate: string | null;
  /** Hides the page title when shown inside the desktop planner tab panel */
  embedded?: boolean;
};

export function TripCalendar({
  days,
  tripStartDate,
  embedded = false,
}: TripCalendarProps) {
  const [pageStart, setPageStart] = useState(0);

  const baseDate = tripStartDate ? parseISO(tripStartDate) : null;

  const daysWithDates = useMemo(
    () =>
      days.map((day) => ({
        ...day,
        computedDate: baseDate ? addDays(baseDate, day.dayNumber - 1) : null,
      })),
    [days, baseDate],
  );

  const visible = daysWithDates.slice(pageStart, pageStart + DAYS_PER_VIEW);
  const canPrev = pageStart > 0;
  const canNext = pageStart + DAYS_PER_VIEW < daysWithDates.length;

  const rangeLabel = useMemo(() => {
    const first = visible[0];
    const last = visible[visible.length - 1];
    if (!first) return "";
    if (first.computedDate && last?.computedDate) {
      const sameMonth =
        first.computedDate.getMonth() === last.computedDate.getMonth();
      return sameMonth
        ? `${format(first.computedDate, "MMM d")} – ${format(last.computedDate, "d, yyyy")}`
        : `${format(first.computedDate, "MMM d")} – ${format(last.computedDate, "MMM d, yyyy")}`;
    }
    return last && last !== first
      ? `Day ${first.dayNumber} – ${last.dayNumber}`
      : `Day ${first.dayNumber}`;
  }, [visible]);

  if (days.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div>
          <ThemeIllustration variant="itinerary" className="mb-4" />
          <p className="font-semibold text-neutral-700">No itinerary yet</p>
          <p className="mt-1 text-sm text-neutral-400">
            Chat with the AI to generate your day-by-day plan
          </p>
        </div>
      </div>
    );
  }

  const allEvents: CalEvent[] = visible.flatMap((day, colIdx) => {
    const schedules = resolveDayItemSchedules(day.items);

    return day.items.map((item) => {
      const schedule = schedules.get(item.id);
      const displayStartTime = schedule?.startTime ?? item.startTime ?? "";
      const displayDuration = schedule?.duration ?? item.duration ?? "";
      const startMins = parseTimeMinutes(displayStartTime) ?? 9 * 60;
      const durMins = parseDurationMinutes(displayDuration);

      return {
        item,
        colIdx,
        startMins,
        durMins,
        displayStartTime,
        displayDuration,
      };
    });
  });

  const navButtons = (
    <div className="flex gap-0.5">
      <button
        type="button"
        disabled={!canPrev}
        onClick={() => setPageStart((p) => Math.max(0, p - DAYS_PER_VIEW))}
        className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        disabled={!canNext}
        onClick={() =>
          setPageStart((p) =>
            Math.min(daysWithDates.length - DAYS_PER_VIEW, p + DAYS_PER_VIEW),
          )
        }
        className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {embedded ? (
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 bg-white px-4 py-3">
          <span className="text-sm font-medium text-neutral-600">
            {rangeLabel}
          </span>
          {navButtons}
        </div>
      ) : (
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-neutral-900">
              Calendar
            </h2>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
              {visible.length} {visible.length === 1 ? "day" : "days"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500">{rangeLabel}</span>
            {navButtons}
          </div>
        </div>
      )}

      {/* ── Day column headers ──────────────────────────────── */}
      <div className="flex shrink-0 border-b border-neutral-200 bg-white">
        <div className="w-14 shrink-0" />
        {visible.map((day) => (
          <div
            key={day.id}
            className="flex-1 border-l border-neutral-100 py-2 text-center"
          >
            <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
              {day.computedDate ? format(day.computedDate, "EEE") : "Day"}
            </p>
            <p className="mt-0.5 text-lg font-semibold leading-none text-neutral-800">
              {day.computedDate
                ? format(day.computedDate, "d")
                : day.dayNumber}
            </p>
          </div>
        ))}
      </div>

      {/* ── Scrollable time grid ────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div
          className="flex"
          style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}
        >
          {/* Time labels */}
          <div className="w-14 shrink-0 select-none">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="relative"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                <span className="absolute -top-2.5 right-2 text-[10px] text-neutral-400">
                  {format(new Date(2000, 0, 1, hour), "ha").toLowerCase()}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {visible.map((day, colIdx) => (
            <div
              key={day.id}
              className="relative min-w-0 flex-1 border-l border-neutral-100"
            >
              {/* Hour grid lines */}
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="pointer-events-none absolute w-full border-t border-neutral-100"
                  style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}
                />
              ))}

              {allEvents
                .filter((e) => e.colIdx === colIdx)
                .map(({ item, startMins, durMins, displayStartTime, displayDuration }) => {
                  const clampedStart = Math.max(
                    startMins,
                    START_HOUR * 60,
                  );
                  const clampedEnd = Math.min(
                    startMins + durMins,
                    END_HOUR * 60,
                  );
                  if (clampedStart >= clampedEnd) return null;

                  const topPx =
                    (clampedStart - START_HOUR * 60) * (HOUR_HEIGHT / 60);
                  const heightPx = Math.max(
                    26,
                    (clampedEnd - clampedStart) * (HOUR_HEIGHT / 60),
                  );
                  const { bg, border, text, Icon } = getEventStyle(item.type);

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "absolute left-0.5 right-0.5 overflow-hidden rounded-md border px-1.5 py-1",
                        bg,
                        border,
                        text,
                      )}
                      style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                    >
                      <div className="flex min-w-0 items-start gap-1">
                        <Icon className="mt-px h-3 w-3 shrink-0 opacity-80" />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-semibold leading-tight">
                            {item.title}
                          </p>
                          {heightPx >= 42 && displayStartTime && (
                            <p className="text-[10px] leading-tight opacity-60">
                              {displayStartTime}
                              {displayDuration && ` · ${displayDuration}`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
