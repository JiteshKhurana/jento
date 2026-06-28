"use client";

import { useEffect, useState, type ComponentProps, type ComponentType } from "react";
import { Clock, ExternalLink, MapPin, Navigation, Star, X } from "lucide-react";
import { PlacePhotoCarousel } from "@/components/places/place-photo-carousel";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { resolveItemBookUrl } from "@/lib/booking/links";
import {
  buildGoogleMapsUrl,
  getPlacePhotoUrl,
  placeHasPhotos,
} from "@/lib/places/utils";
import {
  PlaceInfoSections,
  type PlaceInfoData,
  type PlaceReview,
} from "@/components/places/place-detail-sections";
import type { ItineraryItemData } from "@/components/itinerary/day-timeline";

type FetchedPlaceDetails = {
  name: string;
  address?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  reviews?: PlaceReview[];
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  website?: string | null;
  openingHours?: unknown;
  openNow?: boolean | null;
  priceLevel?: string | null;
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
  Title: ComponentType<ComponentProps<typeof DialogTitle>>;
};

function ItemDetailDialogContent({
  item,
  destination,
  onOpenChange,
  headerActions,
  Title,
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

  const mapsUrl = buildGoogleMapsUrl({
    googlePlaceId,
    name: item.title || item.placeCache?.name,
    address,
    latitude: lat,
    longitude: lng,
  });

  const photoIndices = [0, 1, 2, 3, 4];
  const categoryLabel = getCategoryLabel(item.type);

  const photoUrls =
    hasPhotos && googlePlaceId
      ? photoIndices.flatMap((i) => {
          const url = getPlacePhotoUrl(googlePlaceId, i);
          return url ? [url] : [];
        })
      : [];

  const placeInfo: PlaceInfoData = {
    name: item.title,
    address,
    rating,
    reviewCount,
    phone: details?.phone,
    website: details?.website,
    openingHours: details?.openingHours,
    openNow: details?.openNow,
    priceLevel: details?.priceLevel,
    reviews,
    latitude: lat,
    longitude: lng,
  };

  const bookUrl = resolveItemBookUrl(item.type, item.title, {
    destination,
    bookingUrl: item.bookingUrl,
    website: details?.website ?? item.placeCache?.website,
    latitude: lat,
    longitude: lng,
  });

  return (
    <>
        <div className="sticky top-0 z-10 shrink-0 border-b border-neutral-100 bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <Title className="min-w-0 truncate text-lg font-bold text-neutral-900 md:hidden">
              {item.title}
            </Title>
            <div className="hidden items-center gap-2 md:flex">
              {headerActions}
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-[13px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  Directions
                </a>
              )}
              {bookUrl && (
                <a
                  href={bookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-neutral-800"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Book
                </a>
              )}
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="min-w-0 px-4 pb-4 pt-5">
            <Title className="hidden text-2xl font-bold text-neutral-900 md:block">
              {item.title}
            </Title>

            <div className="mt-2 flex min-w-0 flex-wrap items-center gap-3 text-[15px] text-neutral-500">
              <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[13px] font-medium text-neutral-700">
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
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl">
              {loading ? (
                <Skeleton className="aspect-4/3 w-full rounded-2xl" />
              ) : hasPhotos && photoUrls.length > 0 ? (
                <PlacePhotoCarousel
                  key={photoUrls.join("|")}
                  photos={photoUrls}
                  title={item.title}
                  FallbackIcon={MapPin}
                  className="rounded-2xl"
                />
              ) : lat != null && lng != null ? (
                <div className="flex h-36 items-center justify-center rounded-2xl bg-linear-to-br from-neutral-100 to-neutral-200/60">
                  <MapPin className="h-10 w-10 text-neutral-300" />
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
                    "cursor-pointer pb-3 text-[15px] font-medium capitalize transition-colors",
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
                  overrideDescription={item.description}
                  mapsUrl={mapsUrl}
                  categoryLabel={categoryLabel}
                />
              )}
            </div>
          </div>
        </div>

        {(headerActions || mapsUrl || bookUrl) && (
          <div className="sticky bottom-0 z-10 shrink-0 border-t border-neutral-100 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_12px_rgba(0,0,0,0.06)] md:hidden">
            <div className="flex items-center gap-2">
              {headerActions}
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-2.5 text-[15px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                >
                  <Navigation className="h-4 w-4" />
                  Directions
                </a>
              )}
              {bookUrl && (
                <a
                  href={bookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-neutral-900 px-3 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-neutral-800"
                >
                  <ExternalLink className="h-4 w-4" />
                  Book
                </a>
              )}
            </div>
          </div>
        )}
    </>
  );
}

const desktopDialogClassName = cn(
  "flex flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl",
  "md:h-[min(92vh,860px)] md:max-h-[min(92vh,860px)] md:max-w-3xl",
);

const mobileDrawerClassName =
  "flex h-[88dvh] max-h-[88dvh] flex-col overflow-hidden border-0 bg-white p-0";

export function ItemDetailDialog({
  item,
  destination,
  open,
  onOpenChange,
  headerActions,
}: ItemDetailDialogProps) {
  const isMobile = useIsMobile();

  if (!open || !item) return null;

  const contentProps = {
    item,
    destination,
    onOpenChange,
    headerActions,
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent
          aria-describedby={undefined}
          className={mobileDrawerClassName}
        >
          <ItemDetailDialogContent
            key={item.id}
            {...contentProps}
            Title={DrawerTitle}
          />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        aria-describedby={undefined}
        className={desktopDialogClassName}
      >
        <ItemDetailDialogContent
          key={item.id}
          {...contentProps}
          Title={DialogTitle}
        />
      </DialogContent>
    </Dialog>
  );
}
