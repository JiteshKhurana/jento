"use client";

import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlacePhotoCarousel } from "@/components/places/place-photo-carousel";
import {
  formatReviewCount,
  getMapItemCategory,
  getMapItemLocation,
  getMapItemPhotoUrls,
} from "@/components/map/map-item-utils";
import type { ItineraryItemData } from "@/components/itinerary/day-timeline";

type PlaceDetails = {
  rating?: number | null;
  reviewCount?: number | null;
  address?: string | null;
};

type TripMapHoverCardProps = {
  item: ItineraryItemData;
  destination?: string;
  className?: string;
};

export function TripMapHoverCard({
  item,
  destination,
  className,
}: TripMapHoverCardProps) {
  const googlePlaceId = item.googlePlaceId ?? item.placeCache?.googlePlaceId;
  const [details, setDetails] = useState<PlaceDetails | null>(null);
  const { label, Icon } = getMapItemCategory(item.type);

  useEffect(() => {
    if (!googlePlaceId) return;

    let cancelled = false;
    fetch(`/api/places/${encodeURIComponent(googlePlaceId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PlaceDetails | null) => {
        if (!cancelled && data) setDetails(data);
      });

    return () => {
      cancelled = true;
    };
  }, [googlePlaceId]);

  const photos = useMemo(() => getMapItemPhotoUrls(item), [item]);
  const rating = details?.rating ?? item.placeCache?.rating;
  const reviewCount = details?.reviewCount ?? item.placeCache?.reviewCount;
  const reviewLabel = formatReviewCount(reviewCount);
  const location =
    details?.address?.split(",").slice(-2).join(",").trim() ||
    getMapItemLocation(item, destination);
  const description =
    item.description?.trim() ||
    (location
      ? `${item.title}, located in ${location}, is a ${label.toLowerCase()} on your itinerary.`
      : null);

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
        title={item.title}
        FallbackIcon={Icon}
      />

      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold leading-tight text-neutral-900">
            {item.title}
          </h3>
          {rating != null && (
            <div className="flex shrink-0 items-center gap-1 text-[15px]">
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

        <div className="flex items-center gap-1.5 text-[13px] text-neutral-500">
          <Icon className="h-3.5 w-3.5" />
          <span>{label}</span>
        </div>

        {location && <p className="text-[13px] text-neutral-400">{location}</p>}

        {description && (
          <p className="line-clamp-3 text-[13px] leading-relaxed text-neutral-600">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
