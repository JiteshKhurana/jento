"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Heart, Map as MapIcon } from "lucide-react";
import { ExplorePlaceCard } from "@/components/explore/explore-place-card";
import { PlaceDetailDialog } from "@/components/explore/place-detail-dialog";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
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
  const [mobileView, setMobileView] = useState<"feed" | "map">("feed");

  async function handleSaveToggle(place: PlaceSearchResult) {
    const res = await fetch(
      `/api/saved-places/${encodeURIComponent(place.googlePlaceId)}`,
      { method: "DELETE" },
    );
    if (res.ok) {
      setSavedPlaces((prev) =>
        prev.filter((saved) => saved.googlePlaceId !== place.googlePlaceId),
      );
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
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Heart className="mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm font-medium text-foreground">
              No saved places yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Save places from Explore to see them here
            </p>
            {onSwitchToExplore && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={onSwitchToExplore}
              >
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
        <div
          className={cn(
            "flex min-h-0 flex-col md:w-[58%] md:border-r md:border-border",
            mobileView === "map" && "hidden md:flex",
          )}
        >
          {feedContent}
        </div>

        <div
          className={cn(
            "relative min-h-[50vh] flex-1 md:min-h-0",
            mobileView === "map" ? "block" : "hidden md:block",
          )}
        >
          <ExploreMap
            places={savedPlaces}
            center={mapCenter}
            selectedPlaceId={mapPlaceId}
            onSelectPlace={handleMapSelectPlace}
          />
        </div>
      </div>

      <div className="flex border-t border-border bg-card p-2 md:hidden">
        <button
          type="button"
          onClick={() => setMobileView("feed")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium",
            mobileView === "feed"
              ? "bg-primary text-primary-foreground dark:bg-white dark:text-black"
              : "text-muted-foreground",
          )}
        >
          <Heart className="h-4 w-4" />
          Saved
        </button>
        <button
          type="button"
          onClick={() => setMobileView("map")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium",
            mobileView === "map"
              ? "bg-primary text-primary-foreground dark:bg-white dark:text-black"
              : "text-muted-foreground",
          )}
        >
          <MapIcon className="h-4 w-4" />
          Map
        </button>
      </div>

      <PlaceDetailDialog
        place={selectedPlace}
        destination={selectedPlace?.address ?? "Saved"}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        trips={trips}
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
