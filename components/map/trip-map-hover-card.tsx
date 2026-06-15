"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Star, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
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

type MapPhotoCarouselProps = {
  photos: string[];
  title: string;
  FallbackIcon: LucideIcon;
};

function MapPhotoCarousel({
  photos,
  title,
  FallbackIcon,
}: MapPhotoCarouselProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [loadedUrls, setLoadedUrls] = useState<Set<string>>(() => new Set());
  const [failedUrls, setFailedUrls] = useState<Set<string>>(() => new Set());

  const availablePhotos = useMemo(
    () => photos.filter((url) => !failedUrls.has(url)),
    [photos, failedUrls],
  );

  const clampedIndex =
    availablePhotos.length === 0
      ? 0
      : Math.min(photoIndex, availablePhotos.length - 1);

  useEffect(() => {
    const images: HTMLImageElement[] = [];

    photos.forEach((url) => {
      const img = new Image();
      img.onload = () => {
        setLoadedUrls((current) => new Set(current).add(url));
      };
      img.onerror = () => {
        setFailedUrls((current) => new Set(current).add(url));
      };
      img.src = url;
      images.push(img);
    });

    return () => {
      images.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [photos]);

  const activePhoto = availablePhotos[clampedIndex];
  const isLoading = Boolean(activePhoto && !loadedUrls.has(activePhoto));
  const hasMultiplePhotos = availablePhotos.length > 1;

  function goToPhoto(nextIndex: number) {
    if (availablePhotos.length <= 1) return;
    setPhotoIndex(
      (nextIndex + availablePhotos.length) % availablePhotos.length,
    );
  }

  function handleImageError(url: string) {
    setFailedUrls((current) => new Set(current).add(url));
  }

  if (!activePhoto) {
    return (
      <div className="flex aspect-4/3 items-center justify-center bg-linear-to-br from-neutral-100 to-neutral-200/70">
        <FallbackIcon className="h-10 w-10 text-neutral-300" />
      </div>
    );
  }

  return (
    <div className="relative aspect-4/3 bg-neutral-100">
      {isLoading && <Skeleton className="absolute inset-0 rounded-none" />}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={activePhoto}
        src={activePhoto}
        alt={title}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-150",
          isLoading ? "opacity-0" : "opacity-100",
        )}
        onLoad={() => {
          setLoadedUrls((current) => new Set(current).add(activePhoto));
        }}
        onError={() => handleImageError(activePhoto)}
      />

      {hasMultiplePhotos && (
        <>
          <button
            type="button"
            onClick={() => goToPhoto(clampedIndex - 1)}
            className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-neutral-700 shadow-sm hover:bg-white"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => goToPhoto(clampedIndex + 1)}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-neutral-700 shadow-sm hover:bg-white"
            aria-label="Next photo"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {availablePhotos.map((photo, index) => (
              <span
                key={photo}
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  index === clampedIndex ? "bg-white" : "bg-white/50",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

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
      <MapPhotoCarousel
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
