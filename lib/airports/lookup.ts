import airports from "./airports.json";

type Airport = {
  iata: string;
  name: string;
  lat: number;
  lng: number;
  country: string;
  keywords?: string;
  type: string;
};

const AIRPORTS = airports as Airport[];

const TYPE_PRIORITY: Record<string, number> = {
  large_airport: 3,
  medium_airport: 2,
  small_airport: 1,
};

const IATA_TO_COUNTRY = new Map<string, string>(
  AIRPORTS.map((a) => [a.iata, a.country]),
);

const EARTH_RADIUS_KM = 6371;
const MAX_COORD_DISTANCE_KM = 25;
const MIN_NAME_MATCH_LENGTH = 4;

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nameMatchScore(query: string, candidate: string): number {
  if (candidate.length < MIN_NAME_MATCH_LENGTH) return 0;
  if (query.includes(candidate) || candidate.includes(query)) {
    return candidate.length;
  }
  return 0;
}

function lookupIATAByCoordinates(
  latitude: number,
  longitude: number,
): string | null {
  let best: { iata: string; distance: number; priority: number } | null = null;

  for (const airport of AIRPORTS) {
    const distance = haversineKm(
      latitude,
      longitude,
      airport.lat,
      airport.lng,
    );
    if (distance > MAX_COORD_DISTANCE_KM) continue;

    const priority = TYPE_PRIORITY[airport.type] ?? 0;
    if (
      !best ||
      priority > best.priority ||
      (priority === best.priority && distance < best.distance)
    ) {
      best = { iata: airport.iata, distance, priority };
    }
  }

  return best?.iata ?? null;
}

/**
 * Returns the IATA code for a given airport display name, or null if unknown.
 * Matches against official airport names and keywords from the OurAirports dataset.
 */
export function lookupIATAByAirportName(airportName: string): string | null {
  const normalized = normalizeName(airportName);
  if (!normalized) return null;

  let best: { iata: string; score: number } | null = null;

  for (const airport of AIRPORTS) {
    let score = nameMatchScore(normalized, normalizeName(airport.name));

    if (score === 0 && airport.keywords) {
      for (const keyword of airport.keywords.split(",")) {
        score = Math.max(
          score,
          nameMatchScore(normalized, normalizeName(keyword)),
        );
      }
    }

    if (score > 0 && (!best || score > best.score)) {
      best = { iata: airport.iata, score };
    }
  }

  return best?.iata ?? null;
}

export type LookupIATAOptions = {
  name: string;
  latitude?: number | null;
  longitude?: number | null;
};

/**
 * Resolves an IATA code from Google Places airport data.
 * Prefers coordinate matching, then falls back to name/keyword matching.
 */
export function lookupIATA({
  name,
  latitude,
  longitude,
}: LookupIATAOptions): string | null {
  if (latitude != null && longitude != null) {
    const byCoords = lookupIATAByCoordinates(latitude, longitude);
    if (byCoords) return byCoords;
  }
  return lookupIATAByAirportName(name);
}

/** Returns the ISO 3166-1 alpha-2 country code for an IATA code, or null if unknown. */
export function getCountryByIATA(iata: string): string | null {
  return IATA_TO_COUNTRY.get(iata.toUpperCase()) ?? null;
}
