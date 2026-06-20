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
  phone?: string;
  website?: string;
  openingHours?: string[];
  priceLevel?: string;
  editorialSummary?: string;
  primaryTypeDisplayName?: string;
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

  const body: Record<string, unknown> = {
    textQuery,
    pageSize: resolvedPageSize,
  };

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

export async function getPlaceDetails(
  placeId: string,
): Promise<PlaceDetails | null> {
  const apiKey = getApiKey();
  const apiPlaceId = toApiPlaceId(placeId);

  const res = await fetch(`${PLACES_API_BASE}/${apiPlaceId}`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "id,displayName,formattedAddress,location,rating,userRatingCount,photos,reviews,internationalPhoneNumber,regularOpeningHours,websiteUri,priceLevel,primaryTypeDisplayName,editorialSummary",
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
    photos: (place.photos ?? [])
      .slice(0, 5)
      .map((p: { name: string }) => p.name),
    reviews: (place.reviews ?? [])
      .slice(0, 5)
      .map(
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
    phone: place.internationalPhoneNumber ?? undefined,
    website: place.websiteUri ?? undefined,
    openingHours:
      place.regularOpeningHours?.weekdayDescriptions ?? undefined,
    priceLevel: place.priceLevel ?? undefined,
    editorialSummary: place.editorialSummary?.text ?? undefined,
    primaryTypeDisplayName:
      place.primaryTypeDisplayName?.text ?? undefined,
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

function isStubPlaceCache(cached: {
  photos: unknown;
  address: string | null;
  rating: number | null;
}): boolean {
  return (
    !placeHasPhotos(cached.photos) && !cached.address && cached.rating == null
  );
}

export type ResolvePlaceFallback = {
  title: string;
  destination?: string;
  latitude?: number;
  longitude?: number;
};

/** Resolve a place for itinerary items — validates grounding IDs and falls back to text search. */
export async function resolvePlaceCache(
  placeId: string | undefined | null,
  fallback: ResolvePlaceFallback,
  prisma: import("@/app/generated/prisma/client").PrismaClient,
) {
  if (placeId) {
    const cached = await getOrFetchPlaceCache(placeId, prisma);
    if (cached && !isStubPlaceCache(cached)) {
      return cached;
    }
  }

  const searchQuery = fallback.destination
    ? `${fallback.title} ${fallback.destination}`
    : fallback.title;
  const hasCoords = fallback.latitude != null && fallback.longitude != null;
  const results = await searchPlaces(
    searchQuery,
    hasCoords
      ? {
          latitude: fallback.latitude,
          longitude: fallback.longitude,
          pageSize: 3,
        }
      : { pageSize: 3 },
  );

  for (const result of results) {
    const resolved = await getOrFetchPlaceCache(result.googlePlaceId, prisma);
    if (resolved && !isStubPlaceCache(resolved)) {
      return resolved;
    }
  }

  return null;
}

export async function getOrFetchPlaceCache(
  placeId: string,
  prisma: import("@/app/generated/prisma/client").PrismaClient,
) {
  const storageId = toStoragePlaceId(placeId);

  const cached = await prisma.placeCache.findUnique({
    where: { googlePlaceId: storageId },
  });

  const cacheIsFresh =
    cached &&
    Date.now() - cached.lastFetchedAt.getTime() < CACHE_TTL_MS &&
    cached.name !== "Unknown" &&
    !isStubPlaceCache(cached);

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
      phone: details.phone,
      website: details.website,
      openingHours: details.openingHours ?? [],
      priceLevel: details.priceLevel,
      editorialSummary: details.editorialSummary,
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
      phone: details.phone,
      website: details.website,
      openingHours: details.openingHours ?? [],
      priceLevel: details.priceLevel,
      editorialSummary: details.editorialSummary,
    },
  });
}
