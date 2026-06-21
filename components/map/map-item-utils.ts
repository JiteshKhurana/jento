import {
  BedDouble,
  MapPin,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  buildStaticMapUrl,
  getPlacePhotoUrl,
  placeHasPhotos,
} from "@/lib/places/utils";
import type { ItineraryItemData } from "@/components/itinerary/day-timeline";

export type MapItemCategory = {
  label: string;
  Icon: LucideIcon;
  pinClass: string;
  pinActiveClass: string;
};

export function getMapItemCategory(type: string): MapItemCategory {
  const t = type.toLowerCase();
  if (
    t.includes("restaurant") ||
    t.includes("food") ||
    t.includes("cafe") ||
    t.includes("bar")
  ) {
    return {
      label: "Restaurant",
      Icon: UtensilsCrossed,
      pinClass: "border-amber-300 bg-amber-50 text-amber-800",
      pinActiveClass: "border-amber-700 bg-amber-700 text-white",
    };
  }
  if (
    t.includes("hotel") ||
    t.includes("accommodation") ||
    t.includes("lodging") ||
    t.includes("hostel") ||
    t.includes("stay")
  ) {
    return {
      label: "Stay",
      Icon: BedDouble,
      pinClass: "border-violet-300 bg-violet-50 text-violet-800",
      pinActiveClass: "border-violet-700 bg-violet-700 text-white",
    };
  }
  if (t.includes("activity") || t.includes("tour") || t.includes("adventure")) {
    return {
      label: "Activity",
      Icon: Zap,
      pinClass: "border-teal-300 bg-teal-50 text-teal-800",
      pinActiveClass: "border-teal-700 bg-teal-700 text-white",
    };
  }
  return {
    label: "Attraction",
    Icon: MapPin,
    pinClass: "border-sky-300 bg-sky-50 text-sky-800",
    pinActiveClass: "border-sky-700 bg-sky-700 text-white",
  };
}

export function formatReviewCount(count?: number | null) {
  if (count == null) return null;
  if (count >= 1000) {
    return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`;
  }
  return count.toLocaleString();
}

export function getMapItemPhotoUrls(item: ItineraryItemData): string[] {
  const googlePlaceId = item.googlePlaceId ?? item.placeCache?.googlePlaceId;
  if (googlePlaceId && placeHasPhotos(item.placeCache?.photos)) {
    const photoCount = Array.isArray(item.placeCache?.photos)
      ? item.placeCache.photos.length
      : 0;
    return Array.from({ length: photoCount }, (_, index) => {
      const url = getPlacePhotoUrl(googlePlaceId, index);
      return url ?? "";
    }).filter(Boolean);
  }

  const lat = item.latitude ?? item.placeCache?.latitude;
  const lng = item.longitude ?? item.placeCache?.longitude;
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (lat != null && lng != null && mapsKey) {
    return [buildStaticMapUrl(lat, lng, mapsKey, 640, 360)];
  }

  return [];
}

export function getMapItemLocation(
  item: ItineraryItemData,
  destination?: string,
): string | null {
  const address = item.placeCache?.address;
  if (address) {
    const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return parts.slice(-2).join(", ");
    }
    return address;
  }
  return destination?.trim() || null;
}

export function getPlaceCategoryFromAddress(address?: string): MapItemCategory {
  const lower = (address ?? "").toLowerCase();
  if (lower.includes("hotel") || lower.includes("resort")) {
    return getMapItemCategory("stay");
  }
  if (lower.includes("restaurant") || lower.includes("cafe")) {
    return getMapItemCategory("restaurant");
  }
  return getMapItemCategory("attraction");
}
