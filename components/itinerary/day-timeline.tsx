"use client";

import { useId, useState, useSyncExternalStore } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Route,
  Clock,
  ExternalLink,
  Navigation,
  GripVertical,
  Star,
  MapPin,
  BedDouble,
  UtensilsCrossed,
  Zap,
  Bus,
  Footprints,
  Gauge,
  Car,
  TrainFront,
  Bike,
} from "lucide-react";
import { format } from "date-fns";
import { DEFAULT_BUDGET_CURRENCY, getCurrencySymbol } from "@/lib/trips/intake";
import { getDayDate } from "@/lib/itinerary/time-utils";
import {
  computeDayInsights,
  formatStepCount,
  getFatigueColor,
  getFatigueDescription,
  getFatigueLabel,
  TRANSPORT_MODE_META,
  type TransportMode,
} from "@/lib/itinerary/day-insights";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { ItemEditor } from "@/components/itinerary/item-editor";
import { DayAudioButton } from "@/components/itinerary/day-audio-button";
import { buildStaticMapUrl, placeHasPhotos } from "@/lib/places/utils";

export type ItineraryItemData = {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  startTime?: string | null;
  duration?: string | null;
  sortOrder: number;
  latitude?: number | null;
  longitude?: number | null;
  googlePlaceId?: string | null;
  bookingUrl?: string | null;
  placeCache?: {
    googlePlaceId: string;
    name: string;
    address?: string | null;
    rating?: number | null;
    reviewCount?: number | null;
    reviews?: unknown;
    photos?: unknown;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
};

export type ItineraryDayData = {
  id: string;
  dayNumber: number;
  title: string;
  summary?: string | null;
  estimatedSteps?: number | null;
  fatigueLevel?: string | null;
  cityTransport?: string | null;
  budgetAccommodation?: number | null;
  budgetTransport?: number | null;
  budgetActivities?: number | null;
  budgetFood?: number | null;
  budgetTotal?: number | null;
  items: ItineraryItemData[];
};

const DAY_COLORS = [
  "#171717", // neutral-900
  "#0d9488", // teal-600
  "#7c3aed", // violet-600
  "#db2777", // pink-600
  "#2563eb", // blue-600
  "#ca8a04", // yellow-600
  "#059669", // emerald-600
];

export function getDayColor(dayNumber: number) {
  return DAY_COLORS[(dayNumber - 1) % DAY_COLORS.length];
}

// Map item type → CSS class from globals.css + label
function getCategoryDotColor(type: string): string {
  const t = type.toLowerCase();
  if (
    t.includes("restaurant") ||
    t.includes("food") ||
    t.includes("cafe") ||
    t.includes("bar")
  ) {
    return "#404040";
  }
  if (
    t.includes("hotel") ||
    t.includes("accommodation") ||
    t.includes("lodging") ||
    t.includes("hostel")
  ) {
    return "#7e22ce";
  }
  if (
    t.includes("transport") ||
    t.includes("flight") ||
    t.includes("train") ||
    t.includes("transit")
  ) {
    return "#0369a1";
  }
  if (t.includes("activity") || t.includes("tour") || t.includes("adventure")) {
    return "#15803d";
  }
  return "#1d4ed8";
}

function getCategoryStyle(type: string): { className: string; label: string } {
  const t = type.toLowerCase();
  if (
    t.includes("restaurant") ||
    t.includes("food") ||
    t.includes("cafe") ||
    t.includes("bar")
  ) {
    return { className: "badge-restaurant", label: "Restaurant" };
  }
  if (
    t.includes("hotel") ||
    t.includes("accommodation") ||
    t.includes("lodging") ||
    t.includes("hostel")
  ) {
    return { className: "badge-hotel", label: "Hotel" };
  }
  if (
    t.includes("transport") ||
    t.includes("flight") ||
    t.includes("train") ||
    t.includes("transit")
  ) {
    return { className: "badge-transport", label: "Transport" };
  }
  if (t.includes("activity") || t.includes("tour") || t.includes("adventure")) {
    return { className: "badge-activity", label: "Activity" };
  }
  return { className: "badge-attraction", label: "Attraction" };
}

function resolveImageUrl(
  googlePlaceId: string | null | undefined,
  placeCache: ItineraryItemData["placeCache"],
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): string | null {
  const lat = latitude ?? placeCache?.latitude;
  const lng = longitude ?? placeCache?.longitude;
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (googlePlaceId && placeHasPhotos(placeCache?.photos)) {
    return `/api/places/${encodeURIComponent(googlePlaceId)}/photo?index=0`;
  }
  if (lat != null && lng != null && mapsKey) {
    return buildStaticMapUrl(lat, lng, mapsKey, 400, 180);
  }
  return null;
}

type ItemBlockProps = {
  item: ItineraryItemData;
  tripId: string;
  onUpdate?: () => void;
  onSelectItem?: (itemId: string) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  readOnly?: boolean;
};

function ItemBlock({
  item,
  tripId,
  onUpdate,
  onSelectItem,
  dragHandleProps,
  readOnly = false,
}: ItemBlockProps) {
  const [editing, setEditing] = useState(false);

  const imageUrl = resolveImageUrl(
    item.googlePlaceId,
    item.placeCache,
    item.latitude,
    item.longitude,
  );
  const { className: badgeClass, label: badgeLabel } = getCategoryStyle(
    item.type,
  );

  async function handleSave(updates: Partial<ItineraryItemData>) {
    await fetch(`/api/trips/${tripId}/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    setEditing(false);
    onUpdate?.();
  }

  async function handleDelete() {
    await fetch(`/api/trips/${tripId}/items/${item.id}`, { method: "DELETE" });
    onUpdate?.();
  }

  const mapsUrl =
    item.latitude != null && item.longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`
      : item.placeCache?.name
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.placeCache.name)}`
        : null;

  if (editing && !readOnly) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50/30 p-1">
        <ItemEditor
          item={item}
          onSave={handleSave}
          onDelete={handleDelete}
          dragHandleProps={dragHandleProps}
          readOnly={false}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm transition-all duration-200 hover:border-neutral-300 hover:shadow-md",
        onSelectItem && "cursor-pointer",
      )}
      onClick={() => onSelectItem?.(item.id)}
      role={onSelectItem ? "button" : undefined}
      tabIndex={onSelectItem ? 0 : undefined}
      onKeyDown={(e) => e.key === "Enter" && onSelectItem?.(item.id)}
    >
      {/* Drag handle + actions — shown on hover */}
      {!readOnly && (
        <div className="absolute right-2 top-2 z-20 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-neutral-500 shadow-sm backdrop-blur-sm hover:text-neutral-900"
            aria-label="Edit"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5"
            >
              <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
              <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
            </svg>
          </button>
          {dragHandleProps && (
            <button
              type="button"
              className="flex h-7 w-7 cursor-grab items-center justify-center rounded-full bg-white/90 text-neutral-400 shadow-sm backdrop-blur-sm active:cursor-grabbing"
              aria-label="Drag to reorder"
              {...dragHandleProps}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Photo area */}
      {imageUrl ? (
        <div className="relative h-36 w-full overflow-hidden bg-neutral-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.parentElement!.style.display = "none";
            }}
          />
          {/* Time chip overlaid on photo */}
          {item.startTime && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
              <Clock className="h-3 w-3" />
              {item.startTime}
              {item.duration && (
                <span className="text-white/70"> · {item.duration}</span>
              )}
            </div>
          )}
        </div>
      ) : (
        /* No photo — show gradient placeholder with time chip */
        <div className="relative flex h-14 items-center bg-linear-to-r from-neutral-50 to-neutral-100 px-4">
          <MapPin className="mr-2 h-4 w-4 shrink-0 text-neutral-300" />
          {item.startTime && (
            <span className="ml-auto flex items-center gap-1 rounded-full bg-neutral-200 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-600">
              <Clock className="h-3 w-3" />
              {item.startTime}
              {item.duration && (
                <span className="text-neutral-400"> · {item.duration}</span>
              )}
            </span>
          )}
        </div>
      )}

      {/* Card content */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h4 className="font-semibold leading-snug text-neutral-900 truncate">
                {item.title}
              </h4>
              <span
                className={`tag-pill shrink-0 text-[10px] py-0 ${badgeClass}`}
              >
                {badgeLabel}
              </span>
            </div>
            {item.description && (
              <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-neutral-400">
                {item.description}
              </p>
            )}
          </div>
          {item.placeCache?.rating != null && (
            <div className="shrink-0 flex items-center gap-0.5 text-xs font-semibold text-neutral-700">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {item.placeCache.rating.toFixed(1)}
            </div>
          )}
        </div>

        {/* Quick actions */}
        {(mapsUrl || item.bookingUrl) && (
          <div
            className="mt-2.5 flex items-center gap-2 border-t border-neutral-100 pt-2"
            onClick={(e) => e.stopPropagation()}
          >
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-lg bg-neutral-50 px-2.5 py-1.5 text-[11px] font-medium text-neutral-600 transition-colors hover:bg-teal-50 hover:text-teal-700"
              >
                <Navigation className="h-3 w-3" />
                Directions
              </a>
            )}
            {item.bookingUrl && (
              <a
                href={item.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1.5 text-[11px] font-medium text-neutral-700 transition-colors hover:bg-neutral-200"
              >
                <ExternalLink className="h-3 w-3" />
                Book
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SortableItem(props: ItemBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: props.item.id,
    });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <ItemBlock {...props} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
}

type DayExpenseBreakdownProps = {
  day: ItineraryDayData;
  fallbackDailyBudget: number | null;
  currencyCode: string;
  dayColor: string;
};

const BUDGET_CATEGORIES = [
  { key: "budgetAccommodation" as const, label: "Accommodation", icon: BedDouble, color: "#7c3aed" },
  { key: "budgetFood" as const, label: "Food & Drinks", icon: UtensilsCrossed, color: "#db2777" },
  { key: "budgetActivities" as const, label: "Activities", icon: Zap, color: "#2563eb" },
  { key: "budgetTransport" as const, label: "Transport", icon: Bus, color: "#0d9488" },
] as const;

const FALLBACK_SPLITS = { budgetAccommodation: 0.35, budgetFood: 0.25, budgetActivities: 0.25, budgetTransport: 0.1 } as const;

function DayExpenseBreakdown({
  day,
  fallbackDailyBudget,
  currencyCode,
  dayColor,
}: DayExpenseBreakdownProps) {
  const symbol = getCurrencySymbol(currencyCode);

  const hasAiBudget =
    day.budgetTotal != null &&
    day.budgetTotal > 0;

  const totalToShow = hasAiBudget
    ? (day.budgetTotal as number)
    : fallbackDailyBudget;

  if (!totalToShow) return null;

  function fmt(amount: number) {
    return amount < 1000
      ? `${symbol}${Math.round(amount)}`
      : `${symbol}${(amount / 1000).toFixed(1)}k`;
  }

  return (
    <div
      className="mb-4 overflow-hidden rounded-xl border border-neutral-100"
      style={{ background: `${dayColor}08` }}
    >
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-2.5">
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
          Estimated daily spend
        </span>
        <span className="text-sm font-bold" style={{ color: dayColor }}>
          ~{fmt(totalToShow)}/person
        </span>
      </div>
      <div className="grid grid-cols-2 gap-px bg-neutral-100 sm:grid-cols-4">
        {BUDGET_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const amount = hasAiBudget
            ? (day[cat.key] ?? 0)
            : totalToShow * FALLBACK_SPLITS[cat.key];
          return (
            <div
              key={cat.label}
              className="flex flex-col gap-1 bg-white px-3 py-2.5"
            >
              <div className="flex items-center gap-1.5">
                <Icon className="h-3 w-3 shrink-0" style={{ color: cat.color }} />
                <span className="text-[10px] font-medium text-neutral-500 truncate">
                  {cat.label}
                </span>
              </div>
              <span className="text-sm font-semibold text-neutral-800">
                ~{fmt(amount)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const TRANSPORT_ICONS: Record<
  TransportMode,
  React.ComponentType<{ className?: string }>
> = {
  walk: Footprints,
  metro: TrainFront,
  bus: Bus,
  taxi: Car,
  bike: Bike,
};

type DayActivityInsightProps = {
  day: ItineraryDayData;
  destination?: string;
  dayColor: string;
};

function DayActivityInsight({
  day,
  destination,
  dayColor,
}: DayActivityInsightProps) {
  const insights = computeDayInsights(day.items, {
    destination,
    cityTransport: day.cityTransport,
  });

  const fatigueColor = getFatigueColor(insights.fatigueLevel);

  return (
    <div
      className="mb-4 overflow-hidden rounded-xl border border-neutral-100"
      style={{ background: `${dayColor}08` }}
    >
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Day on foot
        </span>
        <span
          className="flex items-center gap-1.5 text-sm font-bold"
          style={{ color: dayColor }}
        >
          <Footprints className="h-3.5 w-3.5" />
          {formatStepCount(insights.estimatedSteps)} steps
        </span>
      </div>
      <div className="flex flex-col gap-3 bg-white px-4 py-3">
        <div>
          <div className="flex items-center gap-1.5">
            <Gauge
              className="h-3.5 w-3.5 shrink-0"
              style={{ color: fatigueColor }}
            />
            <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
              How tiring
            </span>
          </div>
          <span
            className="mt-0.5 block text-sm font-semibold"
            style={{ color: fatigueColor }}
          >
            {getFatigueLabel(insights.fatigueLevel)}
          </span>
          <p className="text-[11px] leading-relaxed text-neutral-500">
            {getFatigueDescription(insights.fatigueLevel)}
          </p>
        </div>

        {insights.cityTransportModes.length > 0 && (
          <div className="border-t border-neutral-100 pt-3">
            <p className="text-sm font-semibold text-neutral-900">Transport</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {insights.cityTransportModes.map((mode) => {
                const Icon = TRANSPORT_ICONS[mode];
                const { label } = TRANSPORT_MODE_META[mode];
                return (
                  <span
                    key={mode}
                    title={label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-700"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type DayItemsProps = {
  day: ItineraryDayData;
  tripId: string;
  dayColor: string;
  onUpdate?: () => void;
  onSelectItem?: (itemId: string) => void;
  sortable: boolean;
  readOnly?: boolean;
};

function DayItems({
  day,
  tripId,
  dayColor,
  onUpdate,
  onSelectItem,
  sortable,
  readOnly = false,
}: DayItemsProps) {
  const [reordering, setReordering] = useState(false);
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = day.items.findIndex((i) => i.id === active.id);
    const newIndex = day.items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...day.items];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    setReordering(true);
    try {
      await fetch(`/api/trips/${tripId}/items/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayId: day.id,
          itemIds: reordered.map((i) => i.id),
        }),
      });
      onUpdate?.();
    } finally {
      setReordering(false);
    }
  }

  const showTimeRail = day.items.some((item) => item.startTime);
  const itemCount = day.items.length;

  const list = (
    <div className="relative">
      {reordering && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70">
          <Spinner size="sm" />
        </div>
      )}

      <div className="flex flex-col">
        {day.items.map((item, index) => {
          const dotColor = getCategoryDotColor(item.type);
          const isLast = index === itemCount - 1;

          return (
            <div
              key={item.id}
              id={`item-${item.id}`}
              className={cn("relative flex gap-3", !isLast && "pb-1")}
            >
              {showTimeRail && (
                <div className="w-12 shrink-0 pt-6 text-right">
                  {item.startTime ? (
                    <span className="block text-[11px] font-bold tabular-nums leading-none text-neutral-600">
                      {item.startTime}
                    </span>
                  ) : (
                    <span className="block text-[11px] text-neutral-300">—</span>
                  )}
                  {item.duration && (
                    <span className="mt-1 block text-[10px] tabular-nums text-neutral-400">
                      {item.duration}
                    </span>
                  )}
                </div>
              )}

              <div className="relative w-5 shrink-0">
                <div className="flex justify-center pt-6">
                  <div
                    className="relative z-10 box-content h-2.5 w-2.5 shrink-0 rounded-full border-[3px] border-white shadow-sm"
                    style={{ backgroundColor: dotColor }}
                  />
                </div>
                {!isLast && (
                  <div
                    className="pointer-events-none absolute left-1/2 top-10 w-px -translate-x-1/2 rounded-full"
                    style={{
                      height: "calc(100% - 2.5rem + 2rem)",
                      backgroundColor: dayColor,
                    }}
                    aria-hidden
                  />
                )}
              </div>

              <div className="min-w-0 flex-1 pb-4">
                {sortable ? (
                  <SortableItem
                    item={item}
                    tripId={tripId}
                    onUpdate={onUpdate}
                    onSelectItem={onSelectItem}
                    readOnly={readOnly}
                  />
                ) : (
                  <ItemBlock
                    item={item}
                    tripId={tripId}
                    onUpdate={onUpdate}
                    onSelectItem={onSelectItem}
                    readOnly={readOnly}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (!sortable) return list;

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={day.items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        {list}
      </SortableContext>
    </DndContext>
  );
}

type DayTimelineProps = {
  tripId: string;
  days: ItineraryDayData[];
  tripStartDate?: string | null;
  onUpdate?: () => void;
  onSelectItem?: (itemId: string) => void;
  selectedDay?: number;
  readOnly?: boolean;
  budgetPerPerson?: number;
  budgetCurrency?: string;
  destination?: string;
};

export function DayTimeline({
  tripId,
  days,
  tripStartDate = null,
  onUpdate,
  onSelectItem,
  selectedDay,
  readOnly = false,
  budgetPerPerson,
  budgetCurrency = DEFAULT_BUDGET_CURRENCY,
  destination,
}: DayTimelineProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const filteredDays = selectedDay
    ? days.filter((d) => d.dayNumber === selectedDay)
    : days;

  const fallbackDailyBudget =
    budgetPerPerson && days.length > 0 ? budgetPerPerson / days.length : null;

  if (days.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100">
            <Route className="h-8 w-8 text-neutral-500" />
          </div>
          <p className="font-semibold text-neutral-700">No itinerary yet</p>
          <p className="mt-1 text-sm text-neutral-400">
            Chat with the AI to generate your day-by-day plan
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4">
      {filteredDays.map((day) => {
        const dayDate = getDayDate(tripStartDate, day.dayNumber);

        return (
        <section key={day.id} id={`day-${day.dayNumber}`}>
          {/* Day header banner */}
          <div
            className="mb-4 flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ backgroundColor: `${getDayColor(day.dayNumber)}15` }}
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
              style={{ backgroundColor: getDayColor(day.dayNumber) }}
            >
              {day.dayNumber}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-neutral-900 truncate">
                {day.title}
              </h3>
              {dayDate && (
                <p className="truncate text-xs font-medium text-neutral-500">
                  {format(dayDate, "EEEE, MMM d")}
                </p>
              )}
              {day.summary && (
                <p className="truncate text-xs text-neutral-500">
                  {day.summary}
                </p>
              )}
            </div>
            <span className="shrink-0 text-xs font-medium text-neutral-400">
              {day.items.length} {day.items.length === 1 ? "stop" : "stops"}
            </span>
            <DayAudioButton
              tripId={tripId}
              dayNumber={day.dayNumber}
              contentKey={`${day.title}|${day.summary ?? ""}|${day.items.map((i) => i.id).join(",")}`}
              color={getDayColor(day.dayNumber)}
            />
          </div>

          {(day.budgetTotal != null || fallbackDailyBudget != null) && (
            <DayExpenseBreakdown
              day={day}
              fallbackDailyBudget={fallbackDailyBudget}
              currencyCode={budgetCurrency}
              dayColor={getDayColor(day.dayNumber)}
            />
          )}

          {day.items.length > 0 && (
            <>
              <DayActivityInsight
                day={day}
                destination={destination}
                dayColor={getDayColor(day.dayNumber)}
              />
            </>
          )}

          <DayItems
            day={day}
            tripId={tripId}
            dayColor={getDayColor(day.dayNumber)}
            onUpdate={onUpdate}
            onSelectItem={onSelectItem}
            sortable={mounted && !readOnly}
            readOnly={readOnly}
          />
        </section>
        );
      })}
    </div>
  );
}
