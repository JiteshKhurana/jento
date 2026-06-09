import type { PlaceSearchResult } from "@/lib/places/google-places";

type SavedPlaceRecord = {
  googlePlaceId: string | null;
  title: string;
  latitude: number | null;
  longitude: number | null;
  locationLabel: string | null;
  placeCache: {
    googlePlaceId: string;
    name: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    rating: number | null;
    reviewCount: number | null;
  } | null;
};

export function savedPlaceToSearchResult(
  saved: SavedPlaceRecord,
): PlaceSearchResult | null {
  if (!saved.googlePlaceId) return null;

  return {
    googlePlaceId: saved.googlePlaceId,
    name: saved.placeCache?.name ?? saved.title,
    address: saved.placeCache?.address ?? saved.locationLabel ?? undefined,
    latitude: saved.latitude ?? saved.placeCache?.latitude ?? undefined,
    longitude: saved.longitude ?? saved.placeCache?.longitude ?? undefined,
    rating: saved.placeCache?.rating ?? undefined,
    reviewCount: saved.placeCache?.reviewCount ?? undefined,
  };
}

export function savedPlacesToSearchResults(
  places: SavedPlaceRecord[],
): PlaceSearchResult[] {
  return places
    .map(savedPlaceToSearchResult)
    .filter((place): place is PlaceSearchResult => place != null);
}
