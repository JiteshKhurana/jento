export type TripLocationPreference = {
  name: string;
  label: string;
  latitude?: string;
  longitude?: string;
};

export type TripPace = "relaxed" | "moderate" | "fast";

export type DietaryPreference = "pure_veg" | "veg" | "non_veg" | "any";

export type TripPreferences = {
  isRoadTrip?: boolean;
  locations?: TripLocationPreference[];
  startingLocation?: TripLocationPreference;
  pace?: TripPace;
  dietary?: DietaryPreference;
  budgetPerPerson?: number;
  budgetCurrency?: string;
  [key: string]: unknown;
};

export function parseTripPreferences(preferences: unknown): TripPreferences {
  if (!preferences || typeof preferences !== "object") return {};
  return preferences as TripPreferences;
}

export function isRoadTrip(preferences: unknown): boolean {
  return parseTripPreferences(preferences).isRoadTrip === true;
}

export function formatTripLocationLabel(
  location: TripLocationPreference,
): string {
  return (
    location.label.split(",").slice(0, 2).join(",").trim() || location.name
  );
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

const SAME_AREA_RADIUS_KM = 50;

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function normalizePlaceName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function placeNamesMatch(a: string, b: string): boolean {
  const na = normalizePlaceName(a);
  const nb = normalizePlaceName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;

  const shorter = na.length <= nb.length ? na : nb;
  const longer = na.length <= nb.length ? nb : na;
  if (shorter.length >= 3 && longer.startsWith(shorter)) return true;
  if (shorter.length >= 4 && longer.includes(shorter)) return true;
  return false;
}

export function locationsAreSameArea(
  a: TripLocationPreference,
  b: TripLocationPreference,
): boolean {
  const coordsA = getLocationCoords(a);
  const coordsB = getLocationCoords(b);
  if (coordsA && coordsB && haversineKm(coordsA, coordsB) <= SAME_AREA_RADIUS_KM) {
    return true;
  }

  const namesA = [a.name, a.label].filter(Boolean);
  const namesB = [b.name, b.label].filter(Boolean);
  for (const nameA of namesA) {
    for (const nameB of namesB) {
      if (placeNamesMatch(nameA, nameB)) return true;
    }
  }
  return false;
}

export function isLocalTrip(
  preferences: unknown,
  destination: string,
): boolean {
  const startingLocation = getStartingLocation(preferences);
  if (!startingLocation) return false;

  const destLocation = getTripLocations(preferences)[0];
  if (destLocation && locationsAreSameArea(startingLocation, destLocation)) {
    return true;
  }

  return locationsAreSameArea(startingLocation, {
    name: destination,
    label: destination,
  });
}
