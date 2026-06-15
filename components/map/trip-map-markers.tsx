"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { getMapItemCategory } from "@/components/map/map-item-utils";
import { TripMapHoverCard } from "@/components/map/trip-map-hover-card";
import {
  latLngToContainerPoint,
  latLngToPagePoint,
  useMapProjection,
} from "@/components/map/use-map-projection";
import type { ItineraryItemData } from "@/components/itinerary/day-timeline";

export type MapMarkerItem = ItineraryItemData & {
  dayNumber: number;
  lat: number;
  lng: number;
};

type TripMapMarkersProps = {
  map: google.maps.Map;
  items: MapMarkerItem[];
  destination?: string;
  selectedItemId?: string | null;
  onSelectItem?: (itemId: string) => void;
};

const HOVER_LEAVE_DELAY_MS = 120;

export function TripMapMarkers({
  map,
  items,
  destination,
  selectedItemId,
  onSelectItem,
}: TripMapMarkersProps) {
  const { projection, revision } = useMapProjection(map);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const leaveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current) {
        window.clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, []);

  const positions = useMemo(() => {
    if (!projection) return new Map<string, { x: number; y: number }>();
    void revision;

    return new Map(
      items.map((item) => [
        item.id,
        latLngToContainerPoint(projection, item.lat, item.lng),
      ]),
    );
  }, [items, projection, revision]);

  const hoveredItem = items.find((item) => item.id === hoveredItemId) ?? null;

  const hoverCardPosition = useMemo(() => {
    if (!hoveredItem || !projection) return null;
    void revision;
    return latLngToPagePoint(map, projection, hoveredItem.lat, hoveredItem.lng);
  }, [hoveredItem, map, projection, revision]);

  function clearLeaveTimeout() {
    if (leaveTimeoutRef.current) {
      window.clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
  }

  function handleHoverStart(itemId: string) {
    clearLeaveTimeout();
    setHoveredItemId(itemId);
  }

  function handleHoverEnd() {
    clearLeaveTimeout();
    leaveTimeoutRef.current = window.setTimeout(() => {
      setHoveredItemId(null);
    }, HOVER_LEAVE_DELAY_MS);
  }

  if (!projection) return null;

  const hoverCard =
    typeof document !== "undefined" &&
    hoveredItem &&
    hoverCardPosition &&
    createPortal(
      <div
        className="pointer-events-auto fixed z-50 w-72"
        style={{
          left: hoverCardPosition.x,
          top: hoverCardPosition.y,
          transform: "translate(-50%, calc(-100% - 8px))",
        }}
        onMouseEnter={() => handleHoverStart(hoveredItem.id)}
        onMouseLeave={handleHoverEnd}
      >
        <TripMapHoverCard item={hoveredItem} destination={destination} />
      </div>,
      document.body,
    );

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-10">
        {items.map((item) => {
          const position = positions.get(item.id);
          if (!position) return null;

          const isHovered = hoveredItemId === item.id;
          const isSelected = selectedItemId === item.id;
          const { Icon, pinClass, pinActiveClass } = getMapItemCategory(
            item.type,
          );

          return (
            <div
              key={item.id}
              className={cn(
                "absolute",
                isHovered || isSelected ? "z-30" : "z-10",
              )}
              style={{
                left: position.x,
                top: position.y,
                transform: "translate(-12px, -100%)",
              }}
              onMouseEnter={() => handleHoverStart(item.id)}
              onMouseLeave={handleHoverEnd}
            >
              <button
                type="button"
                className="pointer-events-auto flex cursor-pointer items-center gap-1.5 text-left"
                onClick={() => onSelectItem?.(item.id)}
                aria-label={item.title}
              >
                <span
                  className={cn(
                    "flex items-center gap-1 rounded-lg border px-1.5 py-1 shadow-sm transition-colors",
                    isHovered || isSelected ? pinActiveClass : pinClass,
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                </span>
                <span className="max-w-[140px] truncate rounded-md border border-neutral-900 bg-neutral-900 px-1 py-0.5 text-sm font-medium leading-tight text-white shadow-sm">
                  {item.title}
                </span>
              </button>
            </div>
          );
        })}
      </div>
      {hoverCard}
    </>
  );
}
