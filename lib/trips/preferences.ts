export type TripLocationPreference = {
  name: string;
  label: string;
  latitude?: string;
  longitude?: string;
};

export type TripPreferences = {
  isRoadTrip?: boolean;
  locations?: TripLocationPreference[];
  startingLocation?: TripLocationPreference;
  [key: string]: unknown;
};

export function parseTripPreferences(preferences: unknown): TripPreferences {
  if (!preferences || typeof preferences !== "object") return {};
  return preferences as TripPreferences;
}

export function isRoadTrip(preferences: unknown): boolean {
  return parseTripPreferences(preferences).isRoadTrip === true;
}

export function getTripLocations(
  preferences: unknown,
): TripLocationPreference[] {
  const { locations } = parseTripPreferences(preferences);
  if (!Array.isArray(locations)) return [];
  return locations.filter(
    (location): location is TripLocationPreference =>
      !!location &&
      typeof location === "object" &&
      typeof location.name === "string",
  );
}

export function getStartingLocation(
  preferences: unknown,
): TripLocationPreference | null {
  const { startingLocation } = parseTripPreferences(preferences);
  if (
    !startingLocation ||
    typeof startingLocation !== "object" ||
    typeof startingLocation.name !== "string"
  ) {
    return null;
  }
  return startingLocation;
}

export function getLocationCoords(
  location: TripLocationPreference,
): { lat: number; lng: number } | null {
  const lat = location.latitude ? Number.parseFloat(location.latitude) : NaN;
  const lng = location.longitude ? Number.parseFloat(location.longitude) : NaN;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}
