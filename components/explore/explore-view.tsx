"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  ChevronDown,
  LocateFixed,
  Map as MapIcon,
  Search,
} from "lucide-react";
import { ExploreFilters } from "@/components/explore/explore-filters";
import type { BudgetTier } from "@/lib/trips/intake";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingState } from "@/components/ui/spinner";
import { ExplorePlaceCard } from "@/components/explore/explore-place-card";
import { PlaceDetailDialog } from "@/components/explore/place-detail-dialog";
import { EXPLORE_CATEGORIES, type ExploreCategoryId } from "@/lib/explore/categories";
import { cn } from "@/lib/utils";
import type { PlaceSearchResult } from "@/lib/places/google-places";
import type { TripOption } from "@/components/explore/add-to-trip-picker";
import {
  DestinationAutocomplete,
  type SelectedLocation,
} from "@/components/trips/destination-autocomplete";

const ExploreMap = dynamic(
  () => import("@/components/map/explore-map").then((m) => m.ExploreMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-neutral-100">
        <LoadingState label="Loading map…" />
      </div>
    ),
  },
);

const LOCATION_STORAGE_KEY = "jento-explore-location";

type ExploreLocation = {
  name: string;
  label: string;
  latitude?: number;
  longitude?: number;
};

type ExploreViewProps = {
  trips: TripOption[];
  initialSavedIds: string[];
  defaultLocation: ExploreLocation;
};

const locationListeners = new Set<() => void>();

let cachedLocationSnapshot: ExploreLocation | null = null;
let cachedLocationSnapshotKey: string | null = null;

function subscribeToExploreLocation(listener: () => void) {
  locationListeners.add(listener);
  return () => {
    locationListeners.delete(listener);
  };
}

function storeLocation(location: ExploreLocation) {
  try {
    const serialized = JSON.stringify(location);
    localStorage.setItem(LOCATION_STORAGE_KEY, serialized);
    cachedLocationSnapshotKey = serialized;
    cachedLocationSnapshot = location;
    locationListeners.forEach((listener) => listener());
  } catch {
    // ignore storage errors
  }
}

function getExploreLocationSnapshot(defaultLocation: ExploreLocation): ExploreLocation {
  if (typeof window === "undefined") return defaultLocation;

  let raw: string | null = null;
  try {
    raw = localStorage.getItem(LOCATION_STORAGE_KEY);
  } catch {
    return defaultLocation;
  }

  const snapshotKey = raw ?? `default:${JSON.stringify(defaultLocation)}`;
  if (cachedLocationSnapshot && cachedLocationSnapshotKey === snapshotKey) {
    return cachedLocationSnapshot;
  }

  cachedLocationSnapshotKey = snapshotKey;
  cachedLocationSnapshot = raw
    ? (JSON.parse(raw) as ExploreLocation)
    : defaultLocation;
  return cachedLocationSnapshot;
}

export function ExploreView({
  trips,
  initialSavedIds,
  defaultLocation,
}: ExploreViewProps) {
  const location = useSyncExternalStore(
    subscribeToExploreLocation,
    () => getExploreLocationSnapshot(defaultLocation),
    () => defaultLocation,
  );
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [category, setCategory] = useState<ExploreCategoryId>("for-you");
  const [budget, setBudget] = useState<BudgetTier | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  const [savedIds, setSavedIds] = useState<Set<string>>(new Set(initialSavedIds));
  const [addedByPlace, setAddedByPlace] = useState<Map<string, Set<string>>>(new Map());

  const [selectedPlace, setSelectedPlace] = useState<PlaceSearchResult | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [mapPlaceId, setMapPlaceId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"feed" | "map">("feed");

  const activeCategory = EXPLORE_CATEGORIES.find((c) => c.id === category)!;

  const runSearch = useCallback(
    async (query: string) => {
      setLoading(true);
      try {
        const q = query.trim() || activeCategory.query;
        const params = new URLSearchParams({ q, location: location.name });
        if (location.latitude != null && location.longitude != null) {
          params.set("lat", String(location.latitude));
          params.set("lng", String(location.longitude));
        }
        if (budget) {
          params.set("budget", budget);
        }
        const res = await fetch(`/api/places/search?${params}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } finally {
        setLoading(false);
      }
    },
    [location.name, location.latitude, location.longitude, activeCategory.query, budget],
  );

  useEffect(() => {
    const delay = searchQuery.trim() ? 350 : 0;
    const timer = setTimeout(() => {
      void runSearch(searchQuery);
    }, delay);
    return () => clearTimeout(timer);
  }, [
    searchQuery,
    category,
    location.name,
    location.latitude,
    location.longitude,
    budget,
    runSearch,
  ]);

  function handleLocationSelect(selected: SelectedLocation) {
    const next: ExploreLocation = {
      name: selected.name,
      label: selected.label,
      latitude: selected.latitude ? Number.parseFloat(selected.latitude) : undefined,
      longitude: selected.longitude ? Number.parseFloat(selected.longitude) : undefined,
    };
    storeLocation(next);
    setLocationPickerOpen(false);
    setLocationQuery("");
  }

  function applyExploreLocation(next: ExploreLocation) {
    storeLocation(next);
    setLocationPickerOpen(false);
    setLocationError(null);
  }

  async function resolveLocationLabel(latitude: number, longitude: number) {
    const params = new URLSearchParams({
      lat: String(latitude),
      lng: String(longitude),
    });
    const res = await fetch(`/api/locations/reverse?${params}`);
    if (!res.ok) return null;
    return res.json() as Promise<{ name: string; label: string }>;
  }

  async function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported in this browser.");
      return;
    }

    if (!window.isSecureContext) {
      setLocationError("Location access requires HTTPS or localhost.");
      return;
    }

    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        applyExploreLocation({
          name: "Near me",
          label: "Getting your location…",
          latitude,
          longitude,
        });

        try {
          const resolved = await resolveLocationLabel(latitude, longitude);
          if (resolved) {
            applyExploreLocation({
              name: resolved.name,
              label: resolved.label,
              latitude,
              longitude,
            });
          }
        } catch {
          setLocationError("Could not resolve your city name, but nearby results are shown.");
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        setLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError(
            "Location permission denied. Allow location access for this site in your browser settings.",
          );
          return;
        }
        if (error.code === error.TIMEOUT) {
          setLocationError("Timed out getting your location. Try again.");
          return;
        }
        setLocationError("Could not get your location. Try again.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60_000 },
    );
  }

  async function handleSaveToggle(place: PlaceSearchResult, currentlySaved: boolean) {
    if (currentlySaved) {
      const res = await fetch(
        `/api/saved-places/${encodeURIComponent(place.googlePlaceId)}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(place.googlePlaceId);
          return next;
        });
      }
      return;
    }

    const res = await fetch("/api/saved-places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: place.name,
        googlePlaceId: place.googlePlaceId,
        latitude: place.latitude,
        longitude: place.longitude,
        locationLabel: location.label,
      }),
    });

    if (res.ok) {
      setSavedIds((prev) => new Set(prev).add(place.googlePlaceId));
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

  const mapCenter =
    location.latitude != null && location.longitude != null
      ? { lat: location.latitude, lng: location.longitude }
      : null;

  function handleMapSelectPlace(placeId: string) {
    const place = results.find((p) => p.googlePlaceId === placeId);
    if (place) handleSelectPlace(place);
  }

  const feedContent = (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 space-y-3 border-b border-neutral-100 px-4 py-4 md:px-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLocationPickerOpen((open) => !open)}
            className="flex items-center gap-1 text-xl font-bold text-neutral-900"
          >
            {location.name}
            <ChevronDown className="h-5 w-5 text-neutral-500" />
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUseMyLocation}
            disabled={locating}
            className="ml-auto text-neutral-500"
          >
            <LocateFixed className="h-4 w-4" />
            {locating ? "Locating…" : "Near me"}
          </Button>
        </div>

        {locationError && (
          <p className="text-sm text-red-600">{locationError}</p>
        )}

        {locationPickerOpen && (
          <div className="space-y-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            <DestinationAutocomplete
              value={locationQuery}
              onChange={setLocationQuery}
              onSelect={handleLocationSelect}
              placeholder="Search cities, states, or countries…"
              autoFocus
            />
          </div>
        )}

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="h-11 rounded-xl border-neutral-200 bg-neutral-50 pl-9"
            />
          </div>
          <ExploreFilters budget={budget} onBudgetChange={setBudget} />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {EXPLORE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                category === cat.id
                  ? "bg-neutral-900 text-white"
                  : "border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300",
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6">
        <h3 className="mb-3 text-sm font-semibold text-neutral-900">
          {activeCategory.label === "For you" ? "Things To Do" : activeCategory.label}
        </h3>

        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-4/3 w-full rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-400">
            No places found. Try a different search or location.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 pb-6">
            {results.map((place) => (
              <ExplorePlaceCard
                key={place.googlePlaceId}
                place={place}
                destination={location.name}
                trips={trips}
                saved={savedIds.has(place.googlePlaceId)}
                addedTripIds={addedByPlace.get(place.googlePlaceId) ?? new Set()}
                onSaveToggle={handleSaveToggle}
                onTripAdded={(tripId) => handleTripAdded(place.googlePlaceId, tripId)}
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
            "flex min-h-0 flex-col md:w-[58%] md:border-r md:border-neutral-200/80",
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
            places={results}
            destination={location.name}
            center={mapCenter}
            selectedPlaceId={mapPlaceId}
            onSelectPlace={handleMapSelectPlace}
          />
        </div>
      </div>

      <div className="flex border-t border-neutral-200/80 bg-white p-2 md:hidden">
        <button
          type="button"
          onClick={() => setMobileView("feed")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium",
            mobileView === "feed" ? "bg-neutral-900 text-white" : "text-neutral-600",
          )}
        >
          <Search className="h-4 w-4" />
          Explore
        </button>
        <button
          type="button"
          onClick={() => setMobileView("map")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium",
            mobileView === "map" ? "bg-neutral-900 text-white" : "text-neutral-600",
          )}
        >
          <MapIcon className="h-4 w-4" />
          Map
        </button>
      </div>

      <PlaceDetailDialog
        place={selectedPlace}
        destination={location.name}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        trips={trips}
        saved={selectedPlace ? savedIds.has(selectedPlace.googlePlaceId) : false}
        addedTripIds={
          selectedPlace
            ? addedByPlace.get(selectedPlace.googlePlaceId) ?? new Set()
            : new Set()
        }
        onSaveToggle={handleSaveToggle}
        onTripAdded={(tripId) => {
          if (selectedPlace) handleTripAdded(selectedPlace.googlePlaceId, tripId);
        }}
      />
    </div>
  );
}
