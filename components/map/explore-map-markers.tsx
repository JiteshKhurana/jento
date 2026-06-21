"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPlaceCategoryFromAddress } from "@/components/map/map-item-utils";
import { ExploreMapHoverCard } from "@/components/map/explore-map-hover-card";
import {
  latLngToContainerPoint,
  latLngToPagePoint,
  useMapProjection,
} from "@/components/map/use-map-projection";
import type { PlaceSearchResult } from "@/lib/places/google-places";

export type ExploreMapMarkerPlace = PlaceSearchResult & {
  lat: number;
  lng: number;
};

type ExploreMapMarkersProps = {
  map: google.maps.Map;
  places: ExploreMapMarkerPlace[];
  destination?: string;
  selectedPlaceId?: string | null;
  onSelectPlace?: (placeId: string) => void;
  pinStyle?: "category" | "saved";
};

const HOVER_LEAVE_DELAY_MS = 120;

export function ExploreMapMarkers({
  map,
  places,
  destination,
  selectedPlaceId,
  onSelectPlace,
  pinStyle = "category",
}: ExploreMapMarkersProps) {
  const { projection, revision } = useMapProjection(map);
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null);
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
      places.map((place) => [
        place.googlePlaceId,
        latLngToContainerPoint(projection, place.lat, place.lng),
      ]),
    );
  }, [places, projection, revision]);

  const hoveredPlace =
    places.find((place) => place.googlePlaceId === hoveredPlaceId) ?? null;

  const hoverCardPosition = useMemo(() => {
    if (!hoveredPlace || !projection) return null;
    void revision;
    return latLngToPagePoint(
      map,
      projection,
      hoveredPlace.lat,
      hoveredPlace.lng,
    );
  }, [hoveredPlace, map, projection, revision]);

  function clearLeaveTimeout() {
    if (leaveTimeoutRef.current) {
      window.clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
  }

  function handleHoverStart(placeId: string) {
    clearLeaveTimeout();
    setHoveredPlaceId(placeId);
  }

  function handleHoverEnd() {
    clearLeaveTimeout();
    leaveTimeoutRef.current = window.setTimeout(() => {
      setHoveredPlaceId(null);
    }, HOVER_LEAVE_DELAY_MS);
  }

  if (!projection) return null;

  const hoverCard =
    typeof document !== "undefined" &&
    hoveredPlace &&
    hoverCardPosition &&
    createPortal(
      <div
        className="pointer-events-auto fixed z-50 w-72"
        style={{
          left: hoverCardPosition.x,
          top: hoverCardPosition.y,
          transform: "translate(-50%, calc(-100% - 8px))",
        }}
        onMouseEnter={() => handleHoverStart(hoveredPlace.googlePlaceId)}
        onMouseLeave={handleHoverEnd}
      >
        <ExploreMapHoverCard place={hoveredPlace} destination={destination} />
      </div>,
      document.body,
    );

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-10">
        {places.map((place) => {
          const position = positions.get(place.googlePlaceId);
          if (!position) return null;

          const isHovered = hoveredPlaceId === place.googlePlaceId;
          const isSelected = selectedPlaceId === place.googlePlaceId;
          const isActive = isHovered || isSelected;
          const categoryPin =
            pinStyle === "saved"
              ? {
                  Icon: Heart,
                  pinClass:
                    "border-red-300 bg-red-500 text-white",
                  pinActiveClass:
                    "border-red-700 bg-red-600 text-white",
                }
              : getPlaceCategoryFromAddress(place.address, place.name);
          const { Icon, pinClass, pinActiveClass } = categoryPin;

          return (
            <div
              key={place.googlePlaceId}
              className={cn(
                "absolute",
                isHovered || isSelected ? "z-30" : "z-10",
              )}
              style={{
                left: position.x,
                top: position.y,
                transform: "translate(-12px, -100%)",
              }}
              onMouseEnter={() => handleHoverStart(place.googlePlaceId)}
              onMouseLeave={handleHoverEnd}
            >
              <button
                type="button"
                className="pointer-events-auto flex cursor-pointer items-center gap-1.5 text-left"
                onClick={() => onSelectPlace?.(place.googlePlaceId)}
                aria-label={place.name}
              >
                <span
                  className={cn(
                    "flex items-center gap-1 rounded-lg border px-1.5 py-1 shadow-sm transition-colors",
                    isActive ? pinActiveClass : pinClass,
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      pinStyle === "saved" && "fill-current",
                    )}
                  />
                </span>
                <span className="max-w-[140px] truncate rounded-md border border-neutral-900 bg-neutral-900 px-1 py-0.5 text-sm font-medium leading-tight text-white shadow-sm">
                  {place.name}
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
