"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ItineraryDayData } from "@/components/itinerary/day-timeline";
import { TripMapMarkers } from "@/components/map/trip-map-markers";
import { MapControls } from "@/components/map/map-controls";
import { resolveItemCoordinates } from "@/lib/places/utils";
import { cn } from "@/lib/utils";

type TripMapProps = {
  days: ItineraryDayData[];
  destination?: string;
  selectedDay?: number;
  showAllPlaces?: boolean;
  onShowAllPlaces?: () => void;
  selectedItemId?: string | null;
  onSelectItem?: (itemId: string) => void;
};

let mapsOptionsSet = false;

async function geocodeDestination(
  destination: string,
): Promise<{ lat: number; lng: number } | null> {
  const query = destination.trim();
  if (!query) return null;

  const locationsRes = await fetch(
    `/api/locations/search?q=${encodeURIComponent(query)}`,
  );
  if (locationsRes.ok) {
    const results = (await locationsRes.json()) as Array<{
      latitude?: string;
      longitude?: string;
    }>;
    const match = results[0];
    if (match?.latitude && match?.longitude) {
      return {
        lat: Number.parseFloat(match.latitude),
        lng: Number.parseFloat(match.longitude),
      };
    }
  }

  const placesRes = await fetch(
    `/api/places/search?q=${encodeURIComponent(query)}`,
  );
  if (placesRes.ok) {
    const results = (await placesRes.json()) as Array<{
      latitude?: number;
      longitude?: number;
    }>;
    const match = results[0];
    if (match?.latitude != null && match?.longitude != null) {
      return { lat: match.latitude, lng: match.longitude };
    }
  }

  return null;
}

export function TripMap({
  days,
  destination,
  selectedDay,
  showAllPlaces = false,
  onShowAllPlaces,
  selectedItemId,
  onSelectItem,
}: TripMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const [googleMap, setGoogleMap] = useState<google.maps.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [destinationCenter, setDestinationCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const itemsWithCoords = useMemo(
    () =>
      days.flatMap((day) =>
        day.items
          .filter((item) => item.type.toLowerCase() !== "transport")
          .map((item) => {
            const coords = resolveItemCoordinates(item);
            if (!coords) return null;
            return { ...item, dayNumber: day.dayNumber, ...coords };
          })
          .filter((item): item is NonNullable<typeof item> => item != null),
      ),
    [days],
  );

  const visibleItems = useMemo(() => {
    if (showAllPlaces || selectedDay == null) return itemsWithCoords;
    return itemsWithCoords.filter((item) => item.dayNumber === selectedDay);
  }, [itemsWithCoords, selectedDay, showAllPlaces]);

  const destinationQuery = destination?.trim() ?? "";
  const effectiveDestinationCenter = destinationQuery
    ? destinationCenter
    : null;

  useEffect(() => {
    if (!destinationQuery) return;

    let cancelled = false;

    geocodeDestination(destinationQuery).then((center) => {
      if (!cancelled) setDestinationCenter(center);
    });

    return () => {
      cancelled = true;
    };
  }, [destinationQuery]);

  useEffect(() => {
    if (!apiKey || !mapRef.current) return;

    let cancelled = false;

    async function initMap() {
      const { importLibrary, setOptions } =
        await import("@googlemaps/js-api-loader");

      if (!mapsOptionsSet) {
        setOptions({ key: apiKey!, v: "weekly" });
        mapsOptionsSet = true;
      }

      try {
        const mapsLib = await importLibrary("maps");
        if (cancelled || !mapRef.current) return;

        const firstItem = itemsWithCoords[0];
        const defaultCenter = firstItem
          ? { lat: firstItem.lat, lng: firstItem.lng }
          : (effectiveDestinationCenter ?? { lat: 20, lng: 0 });

        const map = new mapsLib.Map(mapRef.current, {
          center: defaultCenter,
          zoom: firstItem ? 13 : effectiveDestinationCenter ? 11 : 2,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: false,
          clickableIcons: false,
        });

        googleMapRef.current = map;
        setGoogleMap(map);
        setMapReady(true);
      } catch {
        if (!cancelled) {
          setMapError(
            "Could not load Google Maps. Enable the Maps JavaScript API in Google Cloud Console.",
          );
        }
      }
    }

    initMap();
    return () => {
      cancelled = true;
      googleMapRef.current = null;
      setGoogleMap(null);
      setMapReady(false);
    };
  }, [apiKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!googleMapRef.current || !mapReady) return;

    if (visibleItems.length === 0) {
      if (effectiveDestinationCenter) {
        googleMapRef.current.setCenter(effectiveDestinationCenter);
        googleMapRef.current.setZoom(11);
      }
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    visibleItems.forEach((item) => {
      bounds.extend({ lat: item.lat, lng: item.lng });
    });

    if (visibleItems.length > 1) {
      googleMapRef.current.fitBounds(bounds, 80);
    } else {
      googleMapRef.current.setCenter({
        lat: visibleItems[0].lat,
        lng: visibleItems[0].lng,
      });
      googleMapRef.current.setZoom(14);
    }
  }, [visibleItems, mapReady, effectiveDestinationCenter]);

  useEffect(() => {
    if (!selectedItemId || !googleMapRef.current) return;
    const item = visibleItems.find((i) => i.id === selectedItemId);
    if (item) {
      googleMapRef.current.panTo({ lat: item.lat, lng: item.lng });
      googleMapRef.current.setZoom(15);
    }
  }, [selectedItemId, visibleItems]);

  if (!apiKey) {
    return (
      <div className="flex h-full items-center justify-center bg-neutral-100 p-4 text-center text-[15px] text-neutral-500">
        Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable the map
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-100 p-4 text-center text-[15px] text-zinc-500">
        {mapError}
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {!mapReady && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-100">
          <p className="text-[15px] text-zinc-500">Loading map...</p>
        </div>
      )}
      <div ref={mapRef} className="h-full w-full" />
      {googleMap && mapReady && (
        <>
          {days.length > 1 && onShowAllPlaces && (
            <button
              type="button"
              onClick={onShowAllPlaces}
              className={cn(
                "pointer-events-auto absolute left-4 top-4 z-20 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold shadow-md transition-colors cursor-pointer",
                showAllPlaces
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
              )}
            >
              Show all items
            </button>
          )}
          <TripMapMarkers
            map={googleMap}
            items={visibleItems}
            destination={destination}
            selectedItemId={selectedItemId}
            onSelectItem={onSelectItem}
          />
          <MapControls map={googleMap} />
        </>
      )}
    </div>
  );
}
