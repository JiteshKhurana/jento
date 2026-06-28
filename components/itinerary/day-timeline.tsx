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
  ExternalLink,
  Navigation,
  GripVertical,
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
  Shuffle,
  Pencil,
} from "lucide-react";
import { DEFAULT_BUDGET_CURRENCY, getCurrencySymbol } from "@/lib/trips/intake";
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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { NoItineraryEmptyState } from "@/components/itinerary/no-itinerary-empty-state";
import { ItemEditor } from "@/components/itinerary/item-editor";
import { DayAudioButton } from "@/components/itinerary/day-audio-button";
import {
  buildStaticMapUrl,
  placeHasPhotos,
  resolveItemCoordinates,
} from "@/lib/places/utils";
import { resolveItemBookUrl } from "@/lib/booking/links";

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
    website?: string | null;
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

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildDirectionsUrl(
  from: ItineraryItemData,
  to: ItineraryItemData,
): string | null {
  const fromCoords = resolveItemCoordinates(from);
  const toCoords = resolveItemCoordinates(to);
  const params = new URLSearchParams({ api: "1" });

  const fromPlaceId = from.googlePlaceId ?? from.placeCache?.googlePlaceId;
  if (fromPlaceId) {
    params.set("origin", from.title || from.placeCache?.name || "");
    params.set("origin_place_id", fromPlaceId.replace(/^places\//, ""));
  } else if (fromCoords) {
    params.set("origin", `${fromCoords.lat},${fromCoords.lng}`);
  } else {
    const text =
      from.title || from.placeCache?.name || from.placeCache?.address;
    if (!text) return null;
    params.set("origin", text);
  }

  const toPlaceId = to.googlePlaceId ?? to.placeCache?.googlePlaceId;
  if (toPlaceId) {
    params.set("destination", to.title || to.placeCache?.name || "");
    params.set("destination_place_id", toPlaceId.replace(/^places\//, ""));
  } else if (toCoords) {
    params.set("destination", `${toCoords.lat},${toCoords.lng}`);
  } else {
    const text = to.title || to.placeCache?.name || to.placeCache?.address;
    if (!text) return null;
    params.set("destination", text);
  }

  return `https://www.google.com/maps/dir/?${params}`;
}

type ItemBlockProps = {
  item: ItineraryItemData;
  tripId: string;
  destination?: string;
  onUpdate?: () => void;
  onSelectItem?: (itemId: string) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  readOnly?: boolean;
};

function ItemBlock({
  item,
  tripId,
  destination,
  onUpdate,
  onSelectItem,
  dragHandleProps,
  readOnly = false,
}: ItemBlockProps) {
  const [editing, setEditing] = useState(false);
  const [suggestingAlternative, setSuggestingAlternative] = useState(false);

  async function handleSuggestAlternative(e: React.MouseEvent) {
    e.stopPropagation();
    setSuggestingAlternative(true);
    try {
      await fetch(`/api/trips/${tripId}/items/${item.id}/suggest-alternative`, {
        method: "POST",
      });
      onUpdate?.();
    } finally {
      setSuggestingAlternative(false);
    }
  }

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
    if (typeof pendo !== "undefined") {
      pendo.track("itinerary_item_edited", {
        tripId,
        itemId: item.id,
        fieldsUpdated: Object.keys(updates).join(","),
      });
    }
    setEditing(false);
    onUpdate?.();
  }

  async function handleDelete() {
    await fetch(`/api/trips/${tripId}/items/${item.id}`, { method: "DELETE" });
    if (typeof pendo !== "undefined") {
      pendo.track("itinerary_item_deleted", {
        tripId,
        itemId: item.id,
        itemTitle: item.title,
        itemType: item.type,
      });
    }
    onUpdate?.();
  }

  const bookUrl = resolveItemBookUrl(item.type, item.title, {
    destination,
    bookingUrl: item.bookingUrl,
    website: item.placeCache?.website,
    latitude: item.latitude,
    longitude: item.longitude,
  });

  if (editing && !readOnly) {
    return (
      <ItemEditor
        item={item}
        badgeClass={badgeClass}
        badgeLabel={badgeLabel}
        onSave={handleSave}
        onDelete={handleDelete}
        onCancel={() => setEditing(false)}
        dragHandleProps={dragHandleProps}
        readOnly={false}
      />
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
      {/* Loading overlay while fetching alternative */}
      {suggestingAlternative && (
        <div className="absolute inset-0 z-2 flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/85 backdrop-blur-[2px]">
          <Shuffle className="h-5 w-5 animate-pulse text-violet-500" />
          <span className="text-[12px] font-medium text-neutral-500">
            Finding alternative…
          </span>
        </div>
      )}

      {/* Drag handle + actions — always visible on touch; hover on desktop */}
      {!readOnly && (
        <div className="absolute right-2 top-2 z-1 flex items-center gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          <button
            type="button"
            onClick={handleSuggestAlternative}
            disabled={suggestingAlternative}
            title="Suggest alternative"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white/90 text-neutral-500 shadow-sm backdrop-blur-sm hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Suggest alternative"
          >
            <Shuffle className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white/90 text-neutral-500 shadow-sm backdrop-blur-sm hover:text-neutral-900"
            aria-label="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
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
        </div>
      ) : (
        <div className="relative flex h-14 items-center bg-linear-to-r from-neutral-50 to-neutral-100 px-4">
          <MapPin className="mr-2 h-4 w-4 shrink-0 text-neutral-300" />
        </div>
      )}

      {/* Card content */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h4 className="truncate font-semibold leading-snug text-black dark:text-white">
                {item.title}
              </h4>
              <span
                className={`tag-pill shrink-0 text-[11px] py-0 ${badgeClass}`}
              >
                {badgeLabel}
              </span>
            </div>
            {item.description && (
              <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                {item.description}
              </p>
            )}
          </div>
          {bookUrl && (
            <a
              href={bookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1.5 text-[12px] font-medium text-neutral-700 transition-colors hover:bg-neutral-200"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
              Book
            </a>
          )}
        </div>
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
  {
    key: "budgetAccommodation" as const,
    label: "Stay",
    icon: BedDouble,
  },
  {
    key: "budgetFood" as const,
    label: "Food",
    icon: UtensilsCrossed,
  },
  {
    key: "budgetActivities" as const,
    label: "Activities",
    icon: Zap,
  },
  {
    key: "budgetTransport" as const,
    label: "Transport",
    icon: Bus,
  },
] as const;

const FALLBACK_SPLITS = {
  budgetAccommodation: 0.35,
  budgetFood: 0.25,
  budgetActivities: 0.25,
  budgetTransport: 0.1,
} as const;

function DayExpenseBreakdown({
  day,
  fallbackDailyBudget,
  currencyCode,
  dayColor,
}: DayExpenseBreakdownProps) {
  const symbol = getCurrencySymbol(currencyCode);

  const hasAiBudget = day.budgetTotal != null && day.budgetTotal > 0;

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
      className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-neutral-100"
      style={{ background: `${dayColor}08` }}
    >
      <div className="flex flex-col gap-0.5 border-b border-neutral-100 px-4 py-2.5">
        <span className="text-[13px] font-semibold text-neutral-500 tracking-wide">
          Daily spend
        </span>
        <span className="text-[15px] font-bold text-black dark:text-white">
          ~{fmt(totalToShow)}/person
        </span>
      </div>
      <div className="grid flex-1 grid-cols-2 grid-rows-2 gap-x-6 gap-y-4 bg-white px-4 py-4 dark:bg-neutral-950">
        {BUDGET_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const amount = hasAiBudget
            ? (day[cat.key] ?? 0)
            : totalToShow * FALLBACK_SPLITS[cat.key];
          return (
            <div key={cat.label} className="flex flex-col justify-center gap-1">
              <div className="flex items-center gap-1.5">
                <Icon className="h-3 w-3 shrink-0 text-black dark:text-white" />
                <span className="text-[11px] font-medium text-neutral-500 truncate">
                  {cat.label}
                </span>
              </div>
              <span className="text-[15px] font-semibold text-neutral-800 dark:text-neutral-200">
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
      className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-neutral-100"
      style={{ background: `${dayColor}08` }}
    >
      <div className="flex flex-col gap-0.5 border-b border-neutral-100 px-4 py-2.5">
        <span className="text-[13px] font-semibold tracking-wide text-neutral-500">
          Day on foot
        </span>
        <span className="flex items-center gap-1.5 text-[15px] font-bold text-black dark:text-white">
          {formatStepCount(insights.estimatedSteps)} steps
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 bg-white px-4 py-3 dark:bg-neutral-950">
        <div>
          <div className="flex items-center gap-1.5">
            <Gauge
              className="h-3.5 w-3.5 shrink-0"
              style={{ color: fatigueColor }}
            />
            <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
              How tiring
            </span>
          </div>
          <span
            className="mt-0.5 block text-[15px] font-semibold"
            style={{ color: fatigueColor }}
          >
            {getFatigueLabel(insights.fatigueLevel)}
          </span>
          <p className="text-[12px] leading-relaxed text-neutral-500">
            {getFatigueDescription(insights.fatigueLevel)}
          </p>
        </div>

        {insights.cityTransportModes.length > 0 && (
          <div className="border-t border-neutral-100 pt-3">
            <p className="text-[15px] font-semibold text-neutral-900">
              Transport
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {insights.cityTransportModes.map((mode) => {
                const Icon = TRANSPORT_ICONS[mode];
                const { label } = TRANSPORT_MODE_META[mode];
                return (
                  <span
                    key={mode}
                    title={label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[13px] font-medium text-neutral-700"
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
  destination?: string;
  onUpdate?: () => void;
  onSelectItem?: (itemId: string) => void;
  sortable: boolean;
  readOnly?: boolean;
  showDistances?: boolean;
};

function DayItems({
  day,
  tripId,
  destination,
  onUpdate,
  onSelectItem,
  sortable,
  readOnly = false,
  showDistances = true,
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
      if (typeof pendo !== "undefined") {
        pendo.track("itinerary_items_reordered", {
          tripId,
          dayId: day.id,
          itemCount: reordered.length,
        });
      }
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
          const nextItem = !isLast ? day.items[index + 1] : null;

          const fromCoords = !isLast ? resolveItemCoordinates(item) : null;
          const toCoords = nextItem ? resolveItemCoordinates(nextItem) : null;
          const distanceKm =
            fromCoords && toCoords
              ? haversineDistance(
                  fromCoords.lat,
                  fromCoords.lng,
                  toCoords.lat,
                  toCoords.lng,
                )
              : null;
          const directionsUrl = nextItem
            ? buildDirectionsUrl(item, nextItem)
            : null;

          return (
            <div
              key={item.id}
              id={`item-${item.id}`}
              className={cn("relative flex gap-3", !isLast && "pb-1")}
            >
              {showTimeRail && (
                <div className="w-12 shrink-0 pt-6 text-right">
                  {item.startTime ? (
                    <span className="block text-[12px] font-bold tabular-nums leading-none text-neutral-600">
                      {item.startTime}
                    </span>
                  ) : (
                    <span className="block text-[12px] text-neutral-300">
                      —
                    </span>
                  )}
                  {item.duration && (
                    <span className="mt-1 block text-[11px] tabular-nums text-neutral-400">
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
                    className="pointer-events-none absolute left-1/2 top-10 w-px -translate-x-1/2 rounded-full bg-neutral-300 dark:bg-neutral-600"
                    style={{ height: "calc(100% - 2.5rem + 2rem)" }}
                    aria-hidden
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="pb-4">
                  {sortable ? (
                    <SortableItem
                      item={item}
                      tripId={tripId}
                      destination={destination}
                      onUpdate={onUpdate}
                      onSelectItem={onSelectItem}
                      readOnly={readOnly}
                    />
                  ) : (
                    <ItemBlock
                      item={item}
                      tripId={tripId}
                      destination={destination}
                      onUpdate={onUpdate}
                      onSelectItem={onSelectItem}
                      readOnly={readOnly}
                    />
                  )}
                </div>
                {!isLast &&
                  showDistances &&
                  (distanceKm !== null || directionsUrl) && (
                    <div className="mb-3 flex items-center gap-2">
                      {distanceKm !== null && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-[12px] font-medium text-neutral-500">
                          <Route className="h-3 w-3" />
                          {distanceKm < 1
                            ? `~${Math.round(distanceKm * 1000)} m`
                            : `~${distanceKm.toFixed(1)} km`}
                        </span>
                      )}
                      {directionsUrl && (
                        <a
                          href={directionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[12px] font-medium text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-700"
                        >
                          <Navigation className="h-3 w-3" />
                          Directions
                        </a>
                      )}
                    </div>
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
  onUpdate?: () => void;
  onSelectItem?: (itemId: string) => void;
  selectedDay?: number;
  readOnly?: boolean;
  budgetPerPerson?: number;
  budgetCurrency?: string;
  destination?: string;
  onChatClick?: () => void;
};

export function DayTimeline({
  tripId,
  days,
  onUpdate,
  onSelectItem,
  selectedDay,
  readOnly = false,
  budgetPerPerson,
  budgetCurrency = DEFAULT_BUDGET_CURRENCY,
  destination,
  onChatClick,
}: DayTimelineProps) {
  const [showDistances, setShowDistances] = useState(true);
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
      <NoItineraryEmptyState onChatClick={readOnly ? undefined : onChatClick} />
    );
  }

  return (
    <div className="space-y-8 p-4">
      {filteredDays.map((day) => {
        return (
          <section key={day.id} id={`day-${day.dayNumber}`}>
            {/* Day header banner */}
            <div className="mb-4 flex items-center gap-3 rounded-xl bg-neutral-100 px-4 py-3 dark:bg-neutral-900">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-[15px] font-black text-white dark:bg-white dark:text-neutral-900">
                {day.dayNumber}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="truncate font-semibold text-black dark:text-white">
                  {day.title}
                </h3>
                <p className="truncate text-[13px] text-neutral-600 dark:text-neutral-400">
                  {day.items.length} {day.items.length === 1 ? "stop" : "stops"}
                </p>
              </div>
              <DayAudioButton
                tripId={tripId}
                dayNumber={day.dayNumber}
                contentKey={`${day.title}|${day.summary ?? ""}|${day.items.map((i) => i.id).join(",")}`}
              />
            </div>

            {(day.budgetTotal != null ||
              fallbackDailyBudget != null ||
              day.items.length > 0) && (
              <div className="mb-4 flex flex-row items-stretch gap-4">
                {(day.budgetTotal != null || fallbackDailyBudget != null) && (
                  <DayExpenseBreakdown
                    day={day}
                    fallbackDailyBudget={fallbackDailyBudget}
                    currencyCode={budgetCurrency}
                    dayColor={getDayColor(day.dayNumber)}
                  />
                )}
                {day.items.length > 0 && (
                  <DayActivityInsight
                    day={day}
                    destination={destination}
                    dayColor={getDayColor(day.dayNumber)}
                  />
                )}
              </div>
            )}

            {day.items.length > 0 && (
              <>
                {day.items.length > 1 && (
                  <div className="mb-4 flex items-center gap-2">
                    <span className="text-[15px] text-neutral-600">
                      Distances
                    </span>
                    <Switch
                      checked={showDistances}
                      onCheckedChange={setShowDistances}
                      aria-label="Show distances between stops"
                    />
                  </div>
                )}
              </>
            )}

            <DayItems
              day={day}
              tripId={tripId}
              destination={destination}
              onUpdate={onUpdate}
              onSelectItem={onSelectItem}
              sortable={mounted && !readOnly}
              readOnly={readOnly}
              showDistances={showDistances}
            />
          </section>
        );
      })}
    </div>
  );
}
