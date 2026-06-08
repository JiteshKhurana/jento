"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getDayColor, type ItineraryDayData } from "@/components/itinerary/day-timeline";
import { resolveItemCoordinates } from "@/lib/places/utils";

type TripMapProps = {
  days: ItineraryDayData[];
  destination?: string;
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
  selectedItemId,
  onSelectItem,
}: TripMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
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
          .map((item) => {
            const coords = resolveItemCoordinates(item);
            if (!coords) return null;
            return { ...item, dayNumber: day.dayNumber, ...coords };
          })
          .filter((item): item is NonNullable<typeof item> => item != null),
      ),
    [days],
  );

  useEffect(() => {
    if (!destination?.trim()) {
      setDestinationCenter(null);
      return;
    }

    let cancelled = false;

    geocodeDestination(destination).then((center) => {
      if (!cancelled) setDestinationCenter(center);
    });

    return () => {
      cancelled = true;
    };
  }, [destination]);

  useEffect(() => {
    if (!apiKey || !mapRef.current) return;

    let cancelled = false;

    async function initMap() {
      const { importLibrary, setOptions } = await import("@googlemaps/js-api-loader");

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
          : destinationCenter ?? { lat: 20, lng: 0 };

        googleMapRef.current = new mapsLib.Map(mapRef.current, {
          center: defaultCenter,
          zoom: firstItem ? 13 : destinationCenter ? 11 : 2,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
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
    };
  }, [apiKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!googleMapRef.current || !mapReady) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (itemsWithCoords.length === 0) {
      if (destinationCenter) {
        googleMapRef.current.setCenter(destinationCenter);
        googleMapRef.current.setZoom(11);
      }
      return;
    }

    const bounds = new google.maps.LatLngBounds();

    itemsWithCoords.forEach((item) => {
      const color = getDayColor(item.dayNumber);
      const marker = new google.maps.Marker({
        position: { lat: item.lat, lng: item.lng },
        map: googleMapRef.current!,
        title: item.title,
        label: {
          text: String(item.dayNumber),
          color: "white",
          fontWeight: "bold",
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "white",
          strokeWeight: 2,
        },
      });

      marker.addListener("click", () => onSelectItem?.(item.id));
      markersRef.current.push(marker);
      bounds.extend(marker.getPosition()!);
    });

    if (itemsWithCoords.length > 1) {
      googleMapRef.current.fitBounds(bounds, 60);
    } else {
      googleMapRef.current.setCenter({
        lat: itemsWithCoords[0].lat,
        lng: itemsWithCoords[0].lng,
      });
      googleMapRef.current.setZoom(14);
    }
  }, [itemsWithCoords, mapReady, destinationCenter, onSelectItem]);

  useEffect(() => {
    if (!selectedItemId || !googleMapRef.current) return;
    const item = itemsWithCoords.find((i) => i.id === selectedItemId);
    if (item) {
      googleMapRef.current.panTo({ lat: item.lat, lng: item.lng });
      googleMapRef.current.setZoom(15);
    }
  }, [selectedItemId, itemsWithCoords]);

  if (!apiKey) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-100 p-4 text-center text-sm text-zinc-500">
        Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable the map
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-100 p-4 text-center text-sm text-zinc-500">
        {mapError}
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {!mapReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-100">
          <p className="text-sm text-zinc-500">Loading map...</p>
        </div>
      )}
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
}
