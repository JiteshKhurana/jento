export function buildStaticMapUrl(
  latitude: number,
  longitude: number,
  apiKey: string,
  width = 600,
  height = 300,
): string {
  const params = new URLSearchParams({
    center: `${latitude},${longitude}`,
    zoom: "15",
    size: `${width}x${height}`,
    scale: "2",
    markers: `color:0x0d9488|${latitude},${longitude}`,
    key: apiKey,
  });
  return `https://maps.googleapis.com/maps/api/staticmap?${params}`;
}

export function placeHasPhotos(photos: unknown): boolean {
  return Array.isArray(photos) && photos.length > 0;
}

export function getPlacePhotoUrl(
  googlePlaceId: string | null | undefined,
  index = 0,
): string | null {
  if (!googlePlaceId) return null;
  return `/api/places/${encodeURIComponent(googlePlaceId)}/photo?index=${index}`;
}

export function toStoragePlaceId(placeId: string): string {
  return placeId.replace(/^places\//, "");
}

export function toApiPlaceId(placeId: string): string {
  return `places/${toStoragePlaceId(placeId)}`;
}

type CoordsSource = {
  latitude?: number | null;
  longitude?: number | null;
  placeCache?: { latitude?: number | null; longitude?: number | null } | null;
};

export function resolveItemCoordinates(
  item: CoordsSource,
): { lat: number; lng: number } | null {
  const lat = item.latitude ?? item.placeCache?.latitude;
  const lng = item.longitude ?? item.placeCache?.longitude;
  if (lat == null || lng == null) return null;
  return { lat, lng };
}

type GoogleMapsUrlOptions = {
  googlePlaceId?: string | null;
  name?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export function buildGoogleMapsUrl({
  googlePlaceId,
  name,
  address,
  latitude,
  longitude,
}: GoogleMapsUrlOptions): string | null {
  if (googlePlaceId) {
    const query = encodeURIComponent(name || address || "Place");
    const placeId = encodeURIComponent(toStoragePlaceId(googlePlaceId));
    return `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${placeId}`;
  }

  const textQuery = name || address;
  if (textQuery) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(textQuery)}`;
  }

  if (latitude != null && longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }

  return null;
}
