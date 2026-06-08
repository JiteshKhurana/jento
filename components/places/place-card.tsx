"use client";

import { Star, ExternalLink, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buildStaticMapUrl, placeHasPhotos } from "@/lib/places/utils";

type PlaceCache = {
  googlePlaceId: string;
  name: string;
  address?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  reviews?: unknown;
  photos?: unknown;
  latitude?: number | null;
  longitude?: number | null;
};

type PlaceCardProps = {
  googlePlaceId?: string | null;
  title: string;
  type: string;
  description?: string | null;
  bookingUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  placeCache?: PlaceCache | null;
  onSelect?: () => void;
};

function resolveImageUrl(
  googlePlaceId: string | null | undefined,
  placeCache: PlaceCache | null | undefined,
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): string | null {
  const lat = latitude ?? placeCache?.latitude;
  const lng = longitude ?? placeCache?.longitude;
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (googlePlaceId && placeHasPhotos(placeCache?.photos)) {
    return `/api/places/${encodeURIComponent(googlePlaceId)}/photo?index=0`;
  }

  if (lat != null && lng != null && mapsKey) {
    return buildStaticMapUrl(lat, lng, mapsKey, 400, 160);
  }

  return null;
}

export function PlaceCard({
  googlePlaceId,
  title,
  type,
  description,
  bookingUrl,
  latitude,
  longitude,
  placeCache,
  onSelect,
}: PlaceCardProps) {
  const reviews =
    (placeCache?.reviews as Array<{
      author: string;
      rating: number;
      text: string;
      relativeTime: string;
    }>) ?? [];

  const imageUrl = resolveImageUrl(googlePlaceId, placeCache, latitude, longitude);
  const showPlaceholder = !imageUrl;

  return (
    <div
      className="cursor-pointer overflow-hidden rounded-2xl border border-neutral-200/80 bg-white transition-all duration-200 hover:shadow-lg"
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect?.()}
    >
      {showPlaceholder ? (
        <div className="flex h-44 w-full items-center justify-center bg-linear-to-br from-neutral-100 to-neutral-200/60">
          <MapPin className="h-8 w-8 text-neutral-300" />
        </div>
      ) : (
        <div className="relative h-44 w-full bg-neutral-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.display = "none";
              img.parentElement?.classList.add("hidden");
            }}
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-neutral-900">{title}</h4>
              <Badge variant="secondary" className="text-[10px] capitalize">
                {type.toLowerCase()}
              </Badge>
            </div>
            {placeCache?.address && (
              <p className="mt-0.5 text-xs text-zinc-500">{placeCache.address}</p>
            )}
          </div>
          {placeCache?.rating && (
            <div className="flex shrink-0 items-center gap-1 text-sm">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-medium">{placeCache.rating.toFixed(1)}</span>
              {placeCache.reviewCount && (
                <span className="text-xs text-zinc-400">({placeCache.reviewCount})</span>
              )}
            </div>
          )}
        </div>

        {description && (
          <p className="mt-2 line-clamp-2 text-xs text-zinc-600">{description}</p>
        )}

        {reviews.slice(0, 2).map((review, i) => (
          <div key={i} className="mt-2 border-t border-zinc-100 pt-2">
            <p className="text-xs text-zinc-500">
              <span className="font-medium text-zinc-700">{review.author}</span>
              {" · "}
              {review.relativeTime}
            </p>
            <p className="mt-0.5 line-clamp-2 text-xs text-zinc-600">{review.text}</p>
          </div>
        ))}

        {bookingUrl && (
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-neutral-900 underline-offset-2 hover:underline"
          >
            Search & book
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
