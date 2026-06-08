"use client";

import { useState } from "react";
import { Info, MapPin, Plus, Star } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { getPlacePhotoUrl } from "@/lib/places/utils";
import type { PlaceSearchResult } from "@/lib/places/google-places";

type PlaceSearchCardProps = {
  place: PlaceSearchResult;
  destination: string;
  onAdd: (place: PlaceSearchResult) => Promise<void>;
  added?: boolean;
};

function guessCategory(address?: string) {
  const lower = (address ?? "").toLowerCase();
  if (lower.includes("hotel") || lower.includes("resort")) return "Stay";
  if (lower.includes("restaurant") || lower.includes("cafe")) return "Restaurant";
  return "Attraction";
}

export function PlaceSearchCard({
  place,
  destination,
  onAdd,
  added = false,
}: PlaceSearchCardProps) {
  const [loading, setLoading] = useState(false);
  const imageUrl = getPlacePhotoUrl(place.googlePlaceId);

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
    <article className="group">
      <div className="relative overflow-hidden rounded-2xl bg-neutral-100">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={place.name}
            className="aspect-[4/3] w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center bg-linear-to-br from-neutral-100 to-neutral-200/60">
            <MapPin className="h-8 w-8 text-neutral-300" />
          </div>
        )}

        <Button
          size="sm"
          variant="secondary"
          disabled={loading || added}
          onClick={handleAdd}
          className="absolute right-2 top-2 h-8 bg-white/95 px-3 text-xs shadow-sm hover:bg-white"
        >
          {loading ? (
            <Spinner size="sm" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          {added ? "Added" : loading ? "Adding…" : "Add"}
        </Button>

        <button
          type="button"
          className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm"
          aria-label="Place info"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
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
