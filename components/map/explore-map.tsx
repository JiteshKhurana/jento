"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PlaceSearchResult } from "@/lib/places/google-places";
import { MapControls } from "@/components/map/map-controls";

type ExploreMapProps = {
  places: PlaceSearchResult[];
  destination?: string;
  center?: { lat: number; lng: number } | null;
  selectedPlaceId?: string | null;
  onSelectPlace?: (placeId: string) => void;
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

export function ExploreMap({
  places,
  destination,
  center,
  selectedPlaceId,
  onSelectPlace,
}: ExploreMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [googleMap, setGoogleMap] = useState<google.maps.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [destinationCenter, setDestinationCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const placesWithCoords = useMemo(
    () =>
      places.filter(
        (
          place,
        ): place is PlaceSearchResult & {
          latitude: number;
          longitude: number;
        } => place.latitude != null && place.longitude != null,
      ),
    [places],
  );

  useEffect(() => {
    if (center) {
      setDestinationCenter(center);
      return;
    }

    if (!destination?.trim()) {
      setDestinationCenter(null);
      return;
    }

    let cancelled = false;
    geocodeDestination(destination).then((resolved) => {
      if (!cancelled) setDestinationCenter(resolved);
    });

    return () => {
      cancelled = true;
    };
  }, [destination, center]);

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

        const firstPlace = placesWithCoords[0];
        const defaultCenter = firstPlace
          ? { lat: firstPlace.latitude, lng: firstPlace.longitude }
          : (destinationCenter ?? { lat: 20, lng: 0 });

        const map = new mapsLib.Map(mapRef.current, {
          center: defaultCenter,
          zoom: firstPlace ? 13 : destinationCenter ? 11 : 2,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: false,
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

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (placesWithCoords.length === 0) {
      if (destinationCenter) {
        googleMapRef.current.setCenter(destinationCenter);
        googleMapRef.current.setZoom(11);
      }
      return;
    }

    const bounds = new google.maps.LatLngBounds();

    placesWithCoords.forEach((place) => {
      const isSelected = place.googlePlaceId === selectedPlaceId;
      const marker = new google.maps.Marker({
        position: { lat: place.latitude, lng: place.longitude },
        map: googleMapRef.current!,
        title: place.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isSelected ? 12 : 9,
          fillColor: isSelected ? "#171717" : "#0d9488",
          fillOpacity: 1,
          strokeColor: "white",
          strokeWeight: 2,
        },
      });

      marker.addListener("click", () => onSelectPlace?.(place.googlePlaceId));
      markersRef.current.push(marker);
      bounds.extend(marker.getPosition()!);
    });

    if (placesWithCoords.length > 1) {
      googleMapRef.current.fitBounds(bounds, 60);
    } else {
      googleMapRef.current.setCenter({
        lat: placesWithCoords[0].latitude,
        lng: placesWithCoords[0].longitude,
      });
      googleMapRef.current.setZoom(14);
    }
  }, [
    placesWithCoords,
    mapReady,
    destinationCenter,
    selectedPlaceId,
    onSelectPlace,
  ]);

  useEffect(() => {
    if (!selectedPlaceId || !googleMapRef.current) return;
    const place = placesWithCoords.find(
      (p) => p.googlePlaceId === selectedPlaceId,
    );
    if (place) {
      googleMapRef.current.panTo({ lat: place.latitude, lng: place.longitude });
      googleMapRef.current.setZoom(15);
    }
  }, [selectedPlaceId, placesWithCoords]);

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
      {googleMap && mapReady && <MapControls map={googleMap} />}
    </div>
  );
}
