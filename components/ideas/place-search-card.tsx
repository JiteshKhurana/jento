"use client";

import { useMemo, useState } from "react";
import { MapPin, Plus, Star } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { PlacePhotoCarousel } from "@/components/places/place-photo-carousel";
import { getPlacePhotoUrl } from "@/lib/places/utils";
import type { PlaceSearchResult } from "@/lib/places/google-places";

type PlaceSearchCardProps = {
  place: PlaceSearchResult;
  destination: string;
  onAdd: (place: PlaceSearchResult) => Promise<void>;
  onSelect?: (place: PlaceSearchResult) => void;
  added?: boolean;
};

function guessCategory(address?: string) {
  const lower = (address ?? "").toLowerCase();
  if (lower.includes("hotel") || lower.includes("resort")) return "Stay";
  if (lower.includes("restaurant") || lower.includes("cafe"))
    return "Restaurant";
  return "Attraction";
}

export function PlaceSearchCard({
  place,
  destination,
  onAdd,
  onSelect,
  added = false,
}: PlaceSearchCardProps) {
  const [loading, setLoading] = useState(false);
  const photoUrls = useMemo(
    () =>
      [0, 1, 2, 3, 4].flatMap((index) => {
        const url = getPlacePhotoUrl(place.googlePlaceId, index);
        return url ? [url] : [];
      }),
    [place.googlePlaceId],
  );

  async function handleAdd() {
    setLoading(true);
    try {
      await onAdd(place);
    } finally {
      setLoading(false);
    }
  }

  const locationParts = place.address?.split(",").slice(-2).join(",").trim();

  return (
    <article
      className="group cursor-pointer"
      onClick={() => onSelect?.(place)}
      onKeyDown={(e) => e.key === "Enter" && onSelect?.(place)}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
    >
      <div className="relative overflow-hidden rounded-2xl bg-neutral-100">
        <PlacePhotoCarousel
          photos={photoUrls}
          title={place.name}
          FallbackIcon={MapPin}
          imageClassName="transition-transform duration-300 group-hover:scale-[1.02]"
        />

        <Button
          size="sm"
          variant="secondary"
          disabled={loading || added}
          onClick={(e) => {
            e.stopPropagation();
            handleAdd();
          }}
          className="absolute right-2 top-2 h-8 bg-white/95 px-3 text-xs shadow-sm hover:bg-white"
        >
          {loading ? <Spinner size="sm" /> : <Plus className="h-3.5 w-3.5" />}
          {added ? "Added" : loading ? "Adding…" : "Add"}
        </Button>
      </div>

      <div className="mt-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-neutral-900">{place.name}</h4>
          {place.rating != null && (
            <div className="flex shrink-0 items-center gap-0.5 text-sm">
              <Star className="h-3.5 w-3.5 fill-neutral-900 text-neutral-900" />
              <span className="font-medium">{place.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <p className="mt-0.5 text-xs text-neutral-500">
          {guessCategory(place.address)}
        </p>
        <p className="text-xs text-neutral-400">
          {locationParts || destination}
        </p>
      </div>
    </article>
  );
}
