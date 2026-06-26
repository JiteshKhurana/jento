"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { LocateFixed, Search } from "lucide-react";
import { ExploreFilters } from "@/components/explore/explore-filters";
import type { BudgetTier } from "@/lib/trips/intake";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingState } from "@/components/ui/spinner";
import { ExplorePlaceCard } from "@/components/explore/explore-place-card";
import { PlaceDetailDialog } from "@/components/explore/place-detail-dialog";
import {
  EXPLORE_CATEGORIES,
  type ExploreCategoryId,
} from "@/lib/explore/categories";
import { cn } from "@/lib/utils";
import type { PlaceSearchResult } from "@/lib/places/google-places";
import type { TripOption } from "@/components/explore/add-to-trip-picker";
import {
  DestinationAutocomplete,
  LocationChip,
  type SelectedLocation,
} from "@/components/trips/destination-autocomplete";

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

const LOCATION_STORAGE_KEY = "jento-explore-location";

type ExploreLocation = {
  name: string;
  label: string;
  latitude?: number;
  longitude?: number;
};

type ExploreViewProps = {
  isSignedIn: boolean;
  trips: TripOption[];
  initialSavedIds: string[];
  defaultLocation: ExploreLocation;
  mobileView: "feed" | "map";
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

function getExploreLocationSnapshot(
  defaultLocation: ExploreLocation,
): ExploreLocation {
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

function exploreLocationToChip(location: ExploreLocation): SelectedLocation {
  return {
    id: `${location.name}-${location.label}`,
    name: location.name,
    label: location.label,
    countryCode: "",
    latitude: location.latitude?.toString(),
    longitude: location.longitude?.toString(),
  };
}

export function ExploreView({
  isSignedIn,
  trips,
  initialSavedIds,
  defaultLocation,
  mobileView,
}: ExploreViewProps) {
  const location = useSyncExternalStore(
    subscribeToExploreLocation,
    () => getExploreLocationSnapshot(defaultLocation),
    () => defaultLocation,
  );
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [category, setCategory] = useState<ExploreCategoryId>("for-you");
  const [budget, setBudget] = useState<BudgetTier | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  const [savedIds, setSavedIds] = useState<Set<string>>(
    new Set(initialSavedIds),
  );
  const [addedByPlace, setAddedByPlace] = useState<Map<string, Set<string>>>(
    new Map(),
  );

  const [selectedPlace, setSelectedPlace] = useState<PlaceSearchResult | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const [mapPlaceId, setMapPlaceId] = useState<string | null>(null);

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
          if (typeof pendo !== "undefined") {
            pendo.track("place_search_executed", {
              searchQuery: q,
              location: location.name,
              category: activeCategory.label,
              budget: budget ?? "none",
              resultsCount: data.length,
            });
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [
      location.name,
      location.latitude,
      location.longitude,
      activeCategory,
      budget,
    ],
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
      latitude: selected.latitude
        ? Number.parseFloat(selected.latitude)
        : undefined,
      longitude: selected.longitude
        ? Number.parseFloat(selected.longitude)
        : undefined,
    };
    if (typeof pendo !== "undefined") {
      pendo.track("explore_location_changed", {
        locationName: selected.name,
        locationLabel: selected.label,
        hasCoordinates: !!(selected.latitude && selected.longitude),
        changeMethod: "search",
      });
    }
    storeLocation(next);
    setShowLocationSearch(false);
    setLocationQuery("");
  }

  function applyExploreLocation(next: ExploreLocation, method = "near_me") {
    if (typeof pendo !== "undefined") {
      pendo.track("explore_location_changed", {
        locationName: next.name,
        locationLabel: next.label,
        hasCoordinates: !!(next.latitude && next.longitude),
        changeMethod: method,
      });
    }
    storeLocation(next);
    setShowLocationSearch(false);
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
          setLocationError(
            "Could not resolve your city name, but nearby results are shown.",
          );
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

  async function handleSaveToggle(
    place: PlaceSearchResult,
    currentlySaved: boolean,
  ) {
    if (currentlySaved) {
      const res = await fetch(
        `/api/saved-places/${encodeURIComponent(place.googlePlaceId)}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        if (typeof pendo !== "undefined") {
          pendo.track("place_unsaved", {
            googlePlaceId: place.googlePlaceId,
            placeName: place.name,
          });
        }
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
      if (typeof pendo !== "undefined") {
        pendo.track("place_saved", {
          googlePlaceId: place.googlePlaceId,
          placeName: place.name,
          location: location.name,
          placeRating: place.rating ?? 0,
        });
      }
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
      <div className="shrink-0 space-y-3 border-b border-border px-4 py-4 md:px-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Label>Location</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUseMyLocation}
              disabled={locating}
              className="text-muted-foreground cursor-pointer"
            >
              <LocateFixed className="h-4 w-4" />
              {locating ? "Locating…" : "Near me"}
            </Button>
          </div>

          {locationError && (
            <p className="text-sm text-red-600">{locationError}</p>
          )}

          <div className="space-y-2">
            <LocationChip
              location={exploreLocationToChip(location)}
              onRemove={() => setShowLocationSearch(true)}
              actionLabel={showLocationSearch ? undefined : "Change location"}
            />

            {showLocationSearch && (
              <DestinationAutocomplete
                value={locationQuery}
                onChange={setLocationQuery}
                onSelect={handleLocationSelect}
                placeholder="Search cities, states, or countries…"
                autoFocus
              />
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="h-11 rounded-xl pl-9"
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
                "shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                category === cat.id
                  ? "bg-primary text-primary-foreground dark:bg-white dark:text-black"
                  : "border border-border bg-card text-foreground hover:border-foreground/30",
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6">
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
          <p className="py-8 text-center text-sm text-muted-foreground">
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
                isSignedIn={isSignedIn}
                saved={savedIds.has(place.googlePlaceId)}
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
            "relative min-h-[50vh] flex-1 overflow-hidden md:min-h-0",
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

      <PlaceDetailDialog
        place={selectedPlace}
        destination={location.name}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        trips={trips}
        isSignedIn={isSignedIn}
        saved={
          selectedPlace ? savedIds.has(selectedPlace.googlePlaceId) : false
        }
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
