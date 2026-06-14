import { searchLocations } from "@/lib/locations/search";
import { searchPlaces } from "@/lib/places/google-places";
import {
  getLocationCoords,
  getTripLocations,
} from "@/lib/trips/preferences";

export type GroundingLatLng = {
  latitude: number;
  longitude: number;
};

function matchesDestination(
  destination: string,
  name: string,
  label: string,
): boolean {
  const dest = destination.trim().toLowerCase();
  const n = name.trim().toLowerCase();
  const l = label.trim().toLowerCase();
  if (!dest) return false;
  return (
    n.includes(dest) ||
    l.includes(dest) ||
    dest.includes(n) ||
    (l.length >= 3 && dest.includes(l.split(",")[0] ?? ""))
  );
}

/** Resolve lat/lng for Gemini Maps grounding from trip destination and preferences. */
export async function resolveTripGroundingLatLng(trip: {
  destination: string;
  preferences?: unknown;
}): Promise<GroundingLatLng | undefined> {
  const locations = getTripLocations(trip.preferences);

  for (const loc of locations) {
    if (!matchesDestination(trip.destination, loc.name, loc.label)) continue;
    const coords = getLocationCoords(loc);
    if (coords) return { latitude: coords.lat, longitude: coords.lng };
  }

  for (const loc of locations) {
    const coords = getLocationCoords(loc);
    if (coords) return { latitude: coords.lat, longitude: coords.lng };
  }

  for (const result of searchLocations(trip.destination, 5)) {
    if (!result.latitude || !result.longitude) continue;
    const lat = Number.parseFloat(result.latitude);
    const lng = Number.parseFloat(result.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { latitude: lat, longitude: lng };
    }
  }

  try {
    const places = await searchPlaces(trip.destination, { pageSize: 1 });
    const place = places[0];
    if (place?.latitude != null && place?.longitude != null) {
      return { latitude: place.latitude, longitude: place.longitude };
    }
  } catch {
    // Maps grounding still works for destination-specific queries without latLng.
  }

  return undefined;
}
