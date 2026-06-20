"use client";

import { useEffect, useState } from "react";
import { Clock, ExternalLink, MapPin, Navigation, Star, X } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  buildStaticMapUrl,
  getPlacePhotoUrl,
  placeHasPhotos,
} from "@/lib/places/utils";
import type { ItineraryItemData } from "@/components/itinerary/day-timeline";

type PlaceReview = {
  author: string;
  rating: number;
  text: string;
  relativeTime: string;
};

type FetchedPlaceDetails = {
  name: string;
  address?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  reviews?: PlaceReview[];
  latitude?: number | null;
  longitude?: number | null;
};

type ItemDetailDialogProps = {
  item: ItineraryItemData | null;
  destination: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  headerActions?: React.ReactNode;
};

function getCategoryLabel(type: string): string {
  const t = type.toLowerCase();
  if (
    t.includes("restaurant") ||
    t.includes("food") ||
    t.includes("cafe") ||
    t.includes("bar")
  ) {
    return "Restaurant";
  }
  if (
    t.includes("hotel") ||
    t.includes("accommodation") ||
    t.includes("lodging") ||
    t.includes("hostel")
  ) {
    return "Hotel";
  }
  if (
    t.includes("transport") ||
    t.includes("flight") ||
    t.includes("train") ||
    t.includes("transit")
  ) {
    return "Transport";
  }
  if (t.includes("activity") || t.includes("tour") || t.includes("adventure")) {
    return "Activity";
  }
  return "Attraction";
}

function parseCachedReviews(reviews: unknown): PlaceReview[] {
  if (!Array.isArray(reviews)) return [];
  return reviews.filter(
    (r): r is PlaceReview =>
      typeof r === "object" && r !== null && "author" in r && "text" in r,
  );
}

type ItemDetailDialogContentProps = {
  item: ItineraryItemData;
  destination: string;
  onOpenChange: (open: boolean) => void;
  headerActions?: React.ReactNode;
};

function ItemDetailDialogContent({
  item,
  destination,
  onOpenChange,
  headerActions,
}: ItemDetailDialogContentProps) {
  const googlePlaceId = item.googlePlaceId ?? item.placeCache?.googlePlaceId;
  const [details, setDetails] = useState<FetchedPlaceDetails | null>(null);
  const [loading, setLoading] = useState(() => Boolean(googlePlaceId));
  const [activeTab, setActiveTab] = useState<
    "overview" | "reviews" | "location"
  >("overview");
  useEffect(() => {
    if (!googlePlaceId) return;

    let cancelled = false;

    fetch(`/api/places/${encodeURIComponent(googlePlaceId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setDetails(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [googlePlaceId]);

  const cachedReviews = parseCachedReviews(item.placeCache?.reviews);
  const reviews = details?.reviews?.length ? details.reviews : cachedReviews;
  const rating = details?.rating ?? item.placeCache?.rating;
  const reviewCount = details?.reviewCount ?? item.placeCache?.reviewCount;
  const address = details?.address ?? item.placeCache?.address;
  const lat = item.latitude ?? details?.latitude ?? item.placeCache?.latitude;
  const lng =
    item.longitude ?? details?.longitude ?? item.placeCache?.longitude;
  const hasPhotos =
    googlePlaceId &&
    (placeHasPhotos(item.placeCache?.photos) || details != null);
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const mapsUrl =
    lat != null && lng != null
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : item.placeCache?.name
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.placeCache.name)}`
        : null;

  const photoIndices = [0, 1, 2, 3, 4];
  const categoryLabel = getCategoryLabel(item.type);

  const photoUrls =
    hasPhotos && googlePlaceId
      ? photoIndices.flatMap((i) => {
          const url = getPlacePhotoUrl(googlePlaceId, i);
          return url ? [url] : [];
        })
      : [];

  return (
    <>
      <DialogContent
        showClose={false}
        className="flex h-[min(92vh,860px)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl"
      >
        <div className="shrink-0 border-b border-neutral-100 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {headerActions}
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  Directions
                </a>
              )}
              {item.bookingUrl && (
                <a
                  href={item.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-800"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Book
                </a>
              )}
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="px-4 pb-4 pt-5">
            <DialogTitle className="text-2xl font-bold text-neutral-900">
              {item.title}
            </DialogTitle>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
              <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
                {categoryLabel}
              </span>
              {rating != null && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-medium text-neutral-900">
                    {rating.toFixed(1)}
                  </span>
                  {reviewCount != null && (
                    <span>({reviewCount.toLocaleString()})</span>
                  )}
                </span>
              )}
              {(item.startTime || item.duration) && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {item.startTime}
                  {item.startTime && item.duration && " · "}
                  {item.duration}
                </span>
              )}
              {address && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{address}</span>
                </span>
              )}
            </div>

            <div className="mt-4">
              {loading ? (
                <Skeleton className="aspect-4/3 w-full rounded-2xl" />
              ) : hasPhotos && photoUrls.length > 0 ? (
                <Carousel opts={{ loop: false }} className="w-full">
                  <CarouselContent className="-ml-2">
                    {photoUrls.map((url, i) => (
                      <CarouselItem key={url} className="pl-2">
                        <div className="overflow-hidden rounded-2xl bg-neutral-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={
                              i === 0 ? item.title : `${item.title} photo ${i + 1}`
                            }
                            className="aspect-4/3 w-full object-cover"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {photoUrls.length > 1 && (
                    <>
                      <CarouselPrevious className="left-2 border-neutral-200 bg-white/90 hover:bg-white" />
                      <CarouselNext className="right-2 border-neutral-200 bg-white/90 hover:bg-white" />
                    </>
                  )}
                </Carousel>
              ) : lat != null && lng != null && mapsKey ? (
                <div className="overflow-hidden rounded-2xl bg-neutral-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={buildStaticMapUrl(lat, lng, mapsKey, 800, 320)}
                    alt={`Map of ${item.title}`}
                    className="h-48 w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-36 items-center justify-center rounded-2xl bg-linear-to-br from-neutral-100 to-neutral-200/60">
                  <MapPin className="h-10 w-10 text-neutral-300" />
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-6 border-b border-neutral-100">
              {(["overview", "reviews", "location"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "pb-3 text-sm font-medium capitalize transition-colors",
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
              {activeTab === "overview" && (
                <div className="space-y-3">
                  {item.description ? (
                    <p className="text-sm leading-relaxed text-neutral-600">
                      {item.description}
                    </p>
                  ) : address ? (
                    <p className="text-sm leading-relaxed text-neutral-600">
                      Visit {item.title} in {destination}. A{" "}
                      {categoryLabel.toLowerCase()} on your itinerary.
                    </p>
                  ) : (
                    <p className="text-sm text-neutral-400">
                      No additional details for this stop.
                    </p>
                  )}
                </div>
              )}

              {activeTab === "reviews" && (
                <div className="space-y-4">
                  {reviews.length === 0 ? (
                    <p className="text-sm text-neutral-400">
                      {googlePlaceId
                        ? "No reviews available yet."
                        : "Reviews are available for places linked to Google Maps."}
                    </p>
                  ) : (
                    reviews.slice(0, 8).map((review, i) => (
                      <div
                        key={i}
                        className="border-b border-neutral-100 pb-4 last:border-0"
                      >
                        <p className="text-sm font-medium text-neutral-900">
                          {review.author}
                          <span className="ml-2 font-normal text-neutral-400">
                            {review.relativeTime}
                          </span>
                        </p>
                        <div className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {review.rating}
                        </div>
                        <p className="mt-2 text-sm text-neutral-600">
                          {review.text}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "location" && (
                <div className="space-y-3 text-sm text-neutral-600">
                  {address ? (
                    <p>{address}</p>
                  ) : (
                    <p className="text-neutral-400">No address on file.</p>
                  )}
                  {lat != null && lng != null && (
                    <p className="text-neutral-400">
                      {lat.toFixed(5)}, {lng.toFixed(5)}
                    </p>
                  )}
                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-teal-700 hover:text-teal-800"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      Open in Google Maps
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </>
  );
}

export function ItemDetailDialog({
  item,
  destination,
  open,
  onOpenChange,
  headerActions,
}: ItemDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && item ? (
        <ItemDetailDialogContent
          key={item.id}
          item={item}
          destination={destination}
          onOpenChange={onOpenChange}
          headerActions={headerActions}
        />
      ) : null}
    </Dialog>
  );
}
