"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { ExplorePlaceCard } from "@/components/explore/explore-place-card";
import { PlaceDetailDialog } from "@/components/explore/place-detail-dialog";
import { Button } from "@/components/ui/button";
import { ThemeIllustration } from "@/components/ui/theme-illustration";
import { LoadingState } from "@/components/ui/spinner";
import type { PlaceSearchResult } from "@/lib/places/google-places";
import { savedPlacesToSearchResults } from "@/lib/saved-places/utils";
import type { TripOption } from "@/components/explore/add-to-trip-picker";

const ExploreMap = dynamic(
  () => import("@/components/map/explore-map").then((m) => m.ExploreMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-secondary">
        <LoadingState label="Loading map…" />
      </div>
    ),
  },
);

type SavedPlaceRecord = Parameters<
  typeof savedPlacesToSearchResults
>[0][number];

type SavedViewProps = {
  trips: TripOption[];
  initialSavedPlaces: SavedPlaceRecord[];
  onSwitchToExplore?: () => void;
};

export function SavedView({
  trips,
  initialSavedPlaces,
  onSwitchToExplore,
}: SavedViewProps) {
  const [savedPlaces, setSavedPlaces] = useState<PlaceSearchResult[]>(() =>
    savedPlacesToSearchResults(initialSavedPlaces),
  );
  const [addedByPlace, setAddedByPlace] = useState<Map<string, Set<string>>>(
    new Map(),
  );

  useEffect(() => {
    let cancelled = false;

    async function refreshSavedPlaces() {
      const res = await fetch("/api/saved-places");
      if (!res.ok || cancelled) return;
      const data = (await res.json()) as SavedPlaceRecord[];
      setSavedPlaces(savedPlacesToSearchResults(data));
    }

    void refreshSavedPlaces();
    return () => {
      cancelled = true;
    };
  }, []);

  const [selectedPlace, setSelectedPlace] = useState<PlaceSearchResult | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const [mapPlaceId, setMapPlaceId] = useState<string | null>(null);

  async function handleSaveToggle(
    place: PlaceSearchResult,
    _currentlySaved?: boolean,
  ) {
    const res = await fetch(
      `/api/saved-places/${encodeURIComponent(place.googlePlaceId)}`,
      { method: "DELETE" },
    );
    if (res.ok) {
      setSavedPlaces((prev) =>
        prev.filter((saved) => saved.googlePlaceId !== place.googlePlaceId),
      );
      setDetailOpen(false);
      setSelectedPlace(null);
      setMapPlaceId(null);
    }
  }

  function handleTripAdded(placeId: string, tripId: string) {
    setAddedByPlace((prev) => {
      const next = new Map(prev);
      const existing = new Set(next.get(placeId) ?? []);
      existing.add(tripId);
      next.set(placeId, existing);
      return next;
    });
  }

  function handleSelectPlace(place: PlaceSearchResult) {
    setSelectedPlace(place);
    setMapPlaceId(place.googlePlaceId);
    setDetailOpen(true);
  }

  const savedPlaceWithCoords = savedPlaces.find(
    (place) => place.latitude != null && place.longitude != null,
  );
  const mapCenter = savedPlaceWithCoords
    ? {
        lat: savedPlaceWithCoords.latitude!,
        lng: savedPlaceWithCoords.longitude!,
      }
    : null;

  function handleMapSelectPlace(placeId: string) {
    const place = savedPlaces.find((p) => p.googlePlaceId === placeId);
    if (place) handleSelectPlace(place);
  }

  const feedContent = (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6">
        {savedPlaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <ThemeIllustration variant="saved" className="mb-6" />

            <h2 className="text-lg font-bold text-neutral-900">
              No saved places yet
            </h2>
            {onSwitchToExplore && (
              <Button
                onClick={onSwitchToExplore}
                className="mt-8 gap-1.5 cursor-pointer"
              >
                <Search className="h-4 w-4" />
                Explore places
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 pb-6">
            {savedPlaces.map((place) => (
              <ExplorePlaceCard
                key={place.googlePlaceId}
                place={place}
                destination={
                  place.address?.split(",").slice(-2).join(",").trim() ||
                  "Saved"
                }
                trips={trips}
                isSignedIn
                saved
                addedTripIds={
                  addedByPlace.get(place.googlePlaceId) ?? new Set()
                }
                onSaveToggle={handleSaveToggle}
                onTripAdded={(tripId) =>
                  handleTripAdded(place.googlePlaceId, tripId)
                }
                onSelect={handleSelectPlace}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="flex min-h-0 flex-col md:w-[58%] md:border-r md:border-border">
          {feedContent}
        </div>

        <div className="relative hidden min-h-0 flex-1 overflow-hidden md:block">
          <ExploreMap
            places={savedPlaces}
            center={mapCenter}
            selectedPlaceId={mapPlaceId}
            onSelectPlace={handleMapSelectPlace}
            pinStyle="saved"
          />
        </div>
      </div>

      <PlaceDetailDialog
        place={selectedPlace}
        destination={selectedPlace?.address ?? "Saved"}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        trips={trips}
        isSignedIn
        saved
        addedTripIds={
          selectedPlace
            ? (addedByPlace.get(selectedPlace.googlePlaceId) ?? new Set())
            : new Set()
        }
        onSaveToggle={handleSaveToggle}
        onTripAdded={(tripId) => {
          if (selectedPlace)
            handleTripAdded(selectedPlace.googlePlaceId, tripId);
        }}
      />
    </div>
  );
}
