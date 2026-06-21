"use client";

import { useEffect, useState } from "react";
import { Heart, MapPin, Star, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { buildGoogleMapsUrl, getPlacePhotoUrl } from "@/lib/places/utils";
import {
  AddToTripPicker,
  type TripOption,
} from "@/components/explore/add-to-trip-picker";
import {
  PlaceInfoSections,
  type PlaceInfoData,
} from "@/components/places/place-detail-sections";
import type { PlaceSearchResult } from "@/lib/places/google-places";

type PlaceDetails = PlaceSearchResult & {
  photos?: string[];
  reviews?: Array<{
    author: string;
    rating: number;
    text: string;
    relativeTime: string;
  }>;
  phone?: string | null;
  website?: string | null;
  openingHours?: unknown;
  openNow?: boolean | null;
  priceLevel?: string | null;
};

type PlaceDetailDialogProps = {
  place: PlaceSearchResult | null;
  destination: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trips: TripOption[];
  saved: boolean;
  addedTripIds: Set<string>;
  onSaveToggle: (place: PlaceSearchResult, saved: boolean) => Promise<void>;
  onTripAdded: (tripId: string) => void;
};

function guessCategory(address?: string) {
  const lower = (address ?? "").toLowerCase();
  if (lower.includes("hotel") || lower.includes("resort")) return "Stay";
  if (lower.includes("restaurant") || lower.includes("cafe"))
    return "Restaurant";
  return "Attraction";
}

export function PlaceDetailDialog({
  place,
  destination,
  open,
  onOpenChange,
  trips,
  saved,
  addedTripIds,
  onSaveToggle,
  onTripAdded,
}: PlaceDetailDialogProps) {
  const placeId = place?.googlePlaceId ?? null;
  const [details, setDetails] = useState<PlaceDetails | null>(null);
  const [fetchedPlaceId, setFetchedPlaceId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "reviews" | "location"
  >("overview");
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevPlaceId, setPrevPlaceId] = useState(placeId);

  if (open !== prevOpen || placeId !== prevPlaceId) {
    setPrevOpen(open);
    setPrevPlaceId(placeId);
    if (!open || !placeId || placeId !== prevPlaceId) {
      setDetails(null);
      setFetchedPlaceId(null);
      setActiveTab("overview");
    }
  }

  const loading = Boolean(open && placeId && fetchedPlaceId !== placeId);

  useEffect(() => {
    if (!open || !place) return;

    const id = place.googlePlaceId;
    let cancelled = false;

    fetch(`/api/places/${encodeURIComponent(id)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) {
          setDetails(data);
          setFetchedPlaceId(id);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, place]);

  if (!place) return null;

  const display = details ?? place;
  const photoIndices = [0, 1, 2, 3, 4];
  const reviews = details?.reviews ?? [];
  const categoryLabel = guessCategory(display.address);

  const mapsUrl = buildGoogleMapsUrl({
    googlePlaceId: place.googlePlaceId,
    name: display.name,
    address: display.address,
    latitude: display.latitude,
    longitude: display.longitude,
  });

  const placeInfo: PlaceInfoData = {
    name: display.name,
    address: display.address,
    rating: display.rating,
    reviewCount: display.reviewCount,
    phone: details?.phone,
    website: details?.website,
    openingHours: details?.openingHours,
    openNow: details?.openNow,
    priceLevel: details?.priceLevel,
    reviews,
    latitude: display.latitude,
    longitude: display.longitude,
  };

  async function handleSave() {
    setSaving(true);
    try {
      await onSaveToggle(place!, saved);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        className="flex h-[min(92vh,860px)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl"
      >
        <div className="shrink-0 border-b border-neutral-100 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={handleSave}
                className={cn(
                  "cursor-pointer",
                  saved && "border-red-200 text-red-600",
                )}
              >
                {saving ? (
                  <Spinner size="sm" />
                ) : (
                  <Heart className={cn("h-4 w-4", saved && "fill-current")} />
                )}
                {saved ? "Saved" : "Save"}
              </Button>
              <AddToTripPicker
                place={place}
                trips={trips}
                addedTripIds={addedTripIds}
                onAdded={onTripAdded}
                variant="button"
                className="cursor-pointer"
              />
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="px-4 pb-4 pt-5">
            <DialogTitle className="text-2xl font-bold text-neutral-900">
              {display.name}
            </DialogTitle>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
              {display.rating != null && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-neutral-900 text-neutral-900" />
                  <span className="font-medium text-neutral-900">
                    {display.rating.toFixed(1)}
                  </span>
                  {display.reviewCount != null && (
                    <span>({display.reviewCount.toLocaleString()})</span>
                  )}
                </span>
              )}
              <span>
                {display.address?.split(",").slice(-2).join(",").trim() ||
                  destination}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {categoryLabel}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {loading ? (
                <>
                  <Skeleton className="col-span-2 row-span-2 aspect-4/5 rounded-2xl" />
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-xl" />
                  ))}
                </>
              ) : (
                <>
                  <div className="col-span-2 row-span-2 overflow-hidden rounded-2xl bg-neutral-100">
                    {getPlacePhotoUrl(place.googlePlaceId, 0) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getPlacePhotoUrl(place.googlePlaceId, 0)!}
                        alt={place.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full min-h-48 items-center justify-center">
                        <MapPin className="h-10 w-10 text-neutral-300" />
                      </div>
                    )}
                  </div>
                  {photoIndices.slice(1).map((index) => {
                    const url = getPlacePhotoUrl(place.googlePlaceId, index);
                    return (
                      <div
                        key={index}
                        className="overflow-hidden rounded-xl bg-neutral-100"
                      >
                        {url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={url}
                            alt=""
                            className="aspect-square w-full object-cover"
                          />
                        ) : (
                          <div className="flex aspect-square items-center justify-center">
                            <MapPin className="h-5 w-5 text-neutral-300" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            <div className="mt-6 flex gap-6 border-b border-neutral-100">
              {(["overview", "reviews", "location"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "cursor-pointer pb-3 text-sm font-medium capitalize transition-colors",
                    activeTab === tab
                      ? "border-b-2 border-neutral-900 text-neutral-900"
                      : "text-neutral-400 hover:text-neutral-600",
                  )}
                >
                  {tab}
                  {tab === "reviews" && reviews.length > 0 && (
                    <span className="ml-1 text-neutral-400">
                      ({reviews.length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-4">
              {loading && activeTab === "overview" ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-4/5 rounded" />
                  <Skeleton className="mt-4 h-24 w-full rounded-xl" />
                </div>
              ) : (
                <PlaceInfoSections
                  info={placeInfo}
                  activeTab={activeTab}
                  destination={destination}
                  mapsUrl={mapsUrl}
                  categoryLabel={categoryLabel}
                />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
