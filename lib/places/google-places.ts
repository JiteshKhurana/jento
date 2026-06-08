import { applyBudgetToQuery } from "@/lib/explore/budget-query";
import type { BudgetTier } from "@/lib/trips/intake";
import {
  placeHasPhotos,
  toApiPlaceId,
  toStoragePlaceId,
} from "@/lib/places/utils";

export {
  buildStaticMapUrl,
  getPlacePhotoUrl,
  placeHasPhotos,
  toStoragePlaceId,
  toApiPlaceId,
} from "@/lib/places/utils";

const PLACES_API_BASE = "https://places.googleapis.com/v1";

export type PlaceSearchResult = {
  googlePlaceId: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  reviewCount?: number;
};

export type PlaceDetails = PlaceSearchResult & {
  photos: string[];
  reviews: Array<{
    author: string;
    rating: number;
    text: string;
    relativeTime: string;
  }>;
};

function getApiKey() {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error("GOOGLE_PLACES_API_KEY is not configured");
  return key;
}

export type SearchPlacesOptions = {
  location?: string;
  latitude?: number;
  longitude?: number;
  budget?: BudgetTier | null;
  pageSize?: number;
};

export async function searchPlaces(
  query: string,
  locationOrOptions?: string | SearchPlacesOptions,
  pageSize = 10,
): Promise<PlaceSearchResult[]> {
  const apiKey = getApiKey();

  const options: SearchPlacesOptions =
    typeof locationOrOptions === "string"
      ? { location: locationOrOptions, pageSize }
      : { pageSize, ...locationOrOptions };

  const resolvedPageSize = options.pageSize ?? pageSize;
  const hasCoords = options.latitude != null && options.longitude != null;
  const budgetedQuery = applyBudgetToQuery(query, options.budget);
  const textQuery =
    hasCoords || !options.location
      ? budgetedQuery
      : `${budgetedQuery} in ${options.location}`;

  const body: Record<string, unknown> = { textQuery, pageSize: resolvedPageSize };

  if (hasCoords) {
    body.locationBias = {
      circle: {
        center: {
          latitude: options.latitude,
          longitude: options.longitude,
        },
        radius: 15000,
      },
    };
  }

  const res = await fetch(`${PLACES_API_BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error("Places search failed:", await res.text());
    return [];
  }

  const data = await res.json();
  return (data.places ?? []).map(
    (place: {
      id: string;
      displayName?: { text: string };
      formattedAddress?: string;
      location?: { latitude: number; longitude: number };
      rating?: number;
      userRatingCount?: number;
    }) => ({
      googlePlaceId: toStoragePlaceId(place.id),
      name: place.displayName?.text ?? "Unknown",
      address: place.formattedAddress,
      latitude: place.location?.latitude,
      longitude: place.location?.longitude,
      rating: place.rating,
      reviewCount: place.userRatingCount,
    }),
  );
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const apiKey = getApiKey();
  const apiPlaceId = toApiPlaceId(placeId);

  const res = await fetch(`${PLACES_API_BASE}/${apiPlaceId}`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "id,displayName,formattedAddress,location,rating,userRatingCount,photos,reviews",
    },
  });

  if (!res.ok) {
    console.error("Place details failed:", await res.text());
    return null;
  }

  const place = await res.json();
  return {
    googlePlaceId: toStoragePlaceId(place.id),
    name: place.displayName?.text ?? "Unknown",
    address: place.formattedAddress,
    latitude: place.location?.latitude,
    longitude: place.location?.longitude,
    rating: place.rating,
    reviewCount: place.userRatingCount,
    photos: (place.photos ?? []).slice(0, 5).map((p: { name: string }) => p.name),
    reviews: (place.reviews ?? []).slice(0, 5).map(
      (r: {
        authorAttribution?: { displayName: string };
        rating: number;
        text?: { text: string };
        relativePublishTimeDescription?: string;
      }) => ({
        author: r.authorAttribution?.displayName ?? "Anonymous",
        rating: r.rating,
        text: r.text?.text ?? "",
        relativeTime: r.relativePublishTimeDescription ?? "",
      }),
    ),
  };
}

export async function fetchPlacePhoto(
  photoName: string,
  maxWidth = 800,
): Promise<ArrayBuffer | null> {
  const apiKey = getApiKey();
  const url = `${PLACES_API_BASE}/${photoName}/media?maxWidthPx=${maxWidth}`;

  const res = await fetch(url, {
    redirect: "follow",
    headers: { "X-Goog-Api-Key": apiKey },
  });
  if (!res.ok) {
    console.error("Place photo failed:", res.status, photoName);
    return null;
  }
  return res.arrayBuffer();
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function getOrFetchPlaceCache(
  placeId: string,
  prisma: import("@/app/generated/prisma/client").PrismaClient,
) {
  const storageId = toStoragePlaceId(placeId);

  const cached = await prisma.placeCache.findUnique({
    where: { googlePlaceId: storageId },
  });

  const isStubCache =
    cached &&
    !placeHasPhotos(cached.photos) &&
    !cached.address &&
    cached.rating == null;

  const cacheIsFresh =
    cached &&
    Date.now() - cached.lastFetchedAt.getTime() < CACHE_TTL_MS &&
    cached.name !== "Unknown" &&
    !isStubCache;

  if (cacheIsFresh) {
    return cached;
  }

  const details = await getPlaceDetails(storageId);
  if (!details) return cached ?? null;

  return prisma.placeCache.upsert({
    where: { googlePlaceId: storageId },
    update: {
      name: details.name,
      address: details.address,
      photos: details.photos,
      rating: details.rating,
      reviewCount: details.reviewCount,
      reviews: details.reviews,
      latitude: details.latitude,
      longitude: details.longitude,
      lastFetchedAt: new Date(),
    },
    create: {
      googlePlaceId: storageId,
      name: details.name,
      address: details.address,
      photos: details.photos,
      rating: details.rating,
      reviewCount: details.reviewCount,
      reviews: details.reviews,
      latitude: details.latitude,
      longitude: details.longitude,
    },
  });
}
