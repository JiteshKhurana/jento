"use client";

import { useMemo, useState } from "react";
import { Heart, MapPin, Star } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { getPlacePhotoUrl } from "@/lib/places/utils";
import { PlacePhotoCarousel } from "@/components/places/place-photo-carousel";
import { AddToTripPicker, type TripOption } from "@/components/explore/add-to-trip-picker";
import type { PlaceSearchResult } from "@/lib/places/google-places";

type ExplorePlaceCardProps = {
  place: PlaceSearchResult;
  destination: string;
  trips: TripOption[];
  saved: boolean;
  addedTripIds: Set<string>;
  onSaveToggle: (place: PlaceSearchResult, saved: boolean) => Promise<void>;
  onTripAdded: (tripId: string) => void;
  onSelect: (place: PlaceSearchResult) => void;
};

function guessCategory(address?: string) {
  const lower = (address ?? "").toLowerCase();
  if (lower.includes("hotel") || lower.includes("resort")) return "Stay";
  if (lower.includes("restaurant") || lower.includes("cafe")) return "Restaurant";
  return "Attraction";
}

function formatReviewCount(count?: number) {
  if (count == null) return null;
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`;
  return String(count);
}

export function ExplorePlaceCard({
  place,
  destination,
  trips,
  saved,
  addedTripIds,
  onSaveToggle,
  onTripAdded,
  onSelect,
}: ExplorePlaceCardProps) {
  const [saving, setSaving] = useState(false);
  const photoUrls = useMemo(
    () =>
      [0, 1, 2, 3, 4].flatMap((index) => {
        const url = getPlacePhotoUrl(place.googlePlaceId, index);
        return url ? [url] : [];
      }),
    [place.googlePlaceId],
  );
  const locationParts = place.address?.split(",").slice(-2).join(",").trim();
  const reviewLabel = formatReviewCount(place.reviewCount);

  async function handleSave(e: React.MouseEvent) {
    e.stopPropagation();
    setSaving(true);
    try {
      await onSaveToggle(place, saved);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article
      className="group cursor-pointer"
      onClick={() => onSelect(place)}
      onKeyDown={(e) => e.key === "Enter" && onSelect(place)}
      role="button"
      tabIndex={0}
    >
      <div className="relative overflow-hidden rounded-2xl bg-neutral-100">
        <PlacePhotoCarousel
          photos={photoUrls}
          title={place.name}
          FallbackIcon={MapPin}
          imageClassName="transition-transform duration-300 group-hover:scale-[1.02]"
        />

        <div className="absolute right-2 top-2 flex gap-1.5">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-colors",
              saved
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-white/95 text-neutral-700 hover:bg-white",
            )}
            aria-label={saved ? "Unsave place" : "Save place"}
          >
            {saving ? (
              <Spinner size="sm" />
            ) : (
              <Heart className={cn("h-4 w-4", saved && "fill-current")} />
            )}
          </button>
          <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <AddToTripPicker
              place={place}
              trips={trips}
              addedTripIds={addedTripIds}
              onAdded={onTripAdded}
            />
          </div>
        </div>
      </div>

      <div className="mt-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-neutral-900">{place.name}</h4>
          {place.rating != null && (
            <div className="flex shrink-0 items-center gap-0.5 text-sm">
              <Star className="h-3.5 w-3.5 fill-neutral-900 text-neutral-900" />
              <span className="font-medium">{place.rating.toFixed(1)}</span>
              {reviewLabel && (
                <span className="text-neutral-400">({reviewLabel})</span>
              )}
            </div>
          )}
        </div>
        <p className="mt-0.5 text-xs text-neutral-500">{guessCategory(place.address)}</p>
        <p className="text-xs text-neutral-400">{locationParts || destination}</p>
        {saved && (
          <p className="mt-1 text-xs text-red-500">Saved</p>
        )}
      </div>
    </article>
  );
}
