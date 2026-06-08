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
import { Route } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { PlaceCard } from "@/components/places/place-card";
import { ItemEditor } from "@/components/itinerary/item-editor";

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
  items: ItineraryItemData[];
};

const DAY_COLORS = [
  "#0d9488",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#ca8a04",
  "#059669",
];

export function getDayColor(dayNumber: number) {
  return DAY_COLORS[(dayNumber - 1) % DAY_COLORS.length];
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
  async function handleSave(updates: Partial<ItineraryItemData>) {
    await fetch(`/api/trips/${tripId}/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    onUpdate?.();
  }

  async function handleDelete() {
    await fetch(`/api/trips/${tripId}/items/${item.id}`, { method: "DELETE" });
    onUpdate?.();
  }

  return (
    <div className="space-y-2">
      <ItemEditor
        item={item}
        onSave={handleSave}
        onDelete={handleDelete}
        dragHandleProps={dragHandleProps}
        readOnly={readOnly}
      />
      <PlaceCard
        googlePlaceId={item.googlePlaceId}
        title={item.title}
        type={item.type}
        description={item.description}
        bookingUrl={item.bookingUrl}
        latitude={item.latitude}
        longitude={item.longitude}
        placeCache={item.placeCache}
        onSelect={() => onSelectItem?.(item.id)}
      />
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

type DayItemsProps = {
  day: ItineraryDayData;
  tripId: string;
  onUpdate?: () => void;
  onSelectItem?: (itemId: string) => void;
  sortable: boolean;
  readOnly?: boolean;
};

function DayItems({
  day,
  tripId,
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

  const list = (
    <div className="relative ml-3 space-y-5 border-l border-neutral-200 pl-5">
      {reordering && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70">
          <Spinner size="sm" />
        </div>
      )}
      {day.items.map((item) => (
        <div key={item.id} id={`item-${item.id}`}>
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
      ))}
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
};

export function DayTimeline({
  tripId,
  days,
  onUpdate,
  onSelectItem,
  selectedDay,
  readOnly = false,
}: DayTimelineProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const filteredDays = selectedDay
    ? days.filter((d) => d.dayNumber === selectedDay)
    : days;

  if (days.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
            <Route className="h-7 w-7 text-neutral-400" />
          </div>
          <p className="font-medium text-neutral-700">No itinerary yet</p>
          <p className="mt-1 text-sm text-neutral-400">
            Chat to generate your day-by-day plan
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {filteredDays.map((day) => (
        <section key={day.id} id={`day-${day.dayNumber}`}>
          <div className="mb-3 flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: getDayColor(day.dayNumber) }}
            >
              {day.dayNumber}
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900">{day.title}</h3>
              {day.summary && (
                <p className="text-xs text-neutral-500">{day.summary}</p>
              )}
            </div>
          </div>

          <DayItems
            day={day}
            tripId={tripId}
            onUpdate={onUpdate}
            onSelectItem={onSelectItem}
            sortable={mounted && !readOnly}
            readOnly={readOnly}
          />
        </section>
      ))}
    </div>
  );
}
