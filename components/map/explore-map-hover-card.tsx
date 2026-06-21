"use client";

import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlacePhotoCarousel } from "@/components/places/place-photo-carousel";
import {
  formatReviewCount,
  getPlaceCategoryFromAddress,
} from "@/components/map/map-item-utils";
import { getPlacePhotoUrl } from "@/lib/places/utils";
import type { PlaceSearchResult } from "@/lib/places/google-places";

type PlaceDetails = {
  rating?: number | null;
  reviewCount?: number | null;
  address?: string | null;
};

type ExploreMapHoverCardProps = {
  place: PlaceSearchResult;
  destination?: string;
  className?: string;
};

export function ExploreMapHoverCard({
  place,
  destination,
  className,
}: ExploreMapHoverCardProps) {
  const [details, setDetails] = useState<PlaceDetails | null>(null);
  const { label, Icon } = getPlaceCategoryFromAddress(place.address);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/places/${encodeURIComponent(place.googlePlaceId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PlaceDetails | null) => {
        if (!cancelled && data) setDetails(data);
      });

    return () => {
      cancelled = true;
    };
  }, [place.googlePlaceId]);

  const photos = useMemo(
    () =>
      [0, 1, 2, 3, 4].flatMap((index) => {
        const url = getPlacePhotoUrl(place.googlePlaceId, index);
        return url ? [url] : [];
      }),
    [place.googlePlaceId],
  );

  const rating = details?.rating ?? place.rating;
  const reviewCount = details?.reviewCount ?? place.reviewCount;
  const reviewLabel = formatReviewCount(reviewCount);
  const location =
    details?.address?.split(",").slice(-2).join(",").trim() ||
    place.address?.split(",").slice(-2).join(",").trim() ||
    destination?.trim() ||
    null;
  const description = location
    ? `${place.name}, located in ${location}, is a ${label.toLowerCase()} worth exploring.`
    : null;

  return (
    <div
      className={cn(
        "w-72 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl",
        className,
      )}
      onClick={(event) => event.stopPropagation()}
    >
      <PlacePhotoCarousel
        key={photos.join("|")}
        photos={photos}
        title={place.name}
        FallbackIcon={Icon}
      />

      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold leading-tight text-neutral-900">
            {place.name}
          </h3>
          {rating != null && (
            <div className="flex shrink-0 items-center gap-1 text-sm">
              <Star className="h-3.5 w-3.5 fill-neutral-900 text-neutral-900" />
              <span className="font-medium text-neutral-900">
                {rating.toFixed(1)}
              </span>
              {reviewLabel && (
                <span className="text-neutral-400">({reviewLabel})</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
          <Icon className="h-3.5 w-3.5" />
          <span>{label}</span>
        </div>

        {location && <p className="text-xs text-neutral-400">{location}</p>}

        {description && (
          <p className="line-clamp-3 text-xs leading-relaxed text-neutral-600">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
