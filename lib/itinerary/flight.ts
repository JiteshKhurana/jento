import type { ActivityItem, ItineraryDraft } from "@/lib/ai/schemas";
import { searchPlaces } from "@/lib/places/google-places";
import {
  getLocationCoords,
  getStartingLocation,
  getTripLocations,
  isLocalTrip,
  isRoadTrip,
} from "@/lib/trips/preferences";
import { lookupIATA } from "@/lib/airports/lookup";

type AirportResult = {
  name: string;
  iataCode: string | null;
};

async function findNearestAirport(
  lat: number,
  lng: number,
): Promise<AirportResult | null> {
  try {
    const results = await searchPlaces("airport", {
      latitude: lat,
      longitude: lng,
      pageSize: 1,
    });
    if (results.length === 0) return null;
    const { name, latitude, longitude } = results[0];
    return {
      name,
      iataCode: lookupIATA({ name, latitude, longitude }),
    };
  } catch {
    return null;
  }
}

async function findAirportByDestination(
  destination: string,
): Promise<AirportResult | null> {
  try {
    const results = await searchPlaces("airport", destination, 1);
    if (results.length === 0) return null;
    const { name, latitude, longitude } = results[0];
    return {
      name,
      iataCode: lookupIATA({ name, latitude, longitude }),
    };
  } catch {
    return null;
  }
}

/**
 * Returns a human-readable label for a flight leg endpoint.
 * Format: "Airport Name (IATA)" when IATA is known, otherwise just the name/fallback.
 */
function formatAirportLabel(
  airport: AirportResult | null,
  fallback: string,
): string {
  if (!airport) return fallback;
  return airport.iataCode
    ? `${airport.name} (${airport.iataCode})`
    : airport.name;
}

function isFlightTransportItem(item: ActivityItem | undefined): boolean {
  if (!item || item.type !== "transport") return false;
  return /flight|fly|depart|airport|airline/i.test(
    `${item.title} ${item.description ?? ""}`,
  );
}

function stripLeadingFlightItems(items: ActivityItem[]): ActivityItem[] {
  const next = [...items];
  while (next.length > 0 && isFlightTransportItem(next[0])) {
    next.shift();
  }
  return next;
}

function stripTrailingFlightItems(items: ActivityItem[]): ActivityItem[] {
  const next = [...items];
  while (next.length > 0 && isFlightTransportItem(next[next.length - 1])) {
    next.pop();
  }
  return next;
}

function stripFlightItemsFromDraft(draft: ItineraryDraft): ItineraryDraft {
  return {
    days: draft.days.map((day) => ({
      ...day,
      items: day.items.filter((item) => !isFlightTransportItem(item)),
    })),
  };
}

function buildFlightItem(
  originLabel: string,
  destinationLabel: string,
  label: "outbound" | "return",
): ActivityItem {
  const title =
    label === "return"
      ? `Flight from ${destinationLabel} back to ${originLabel}`
      : `Flight from ${originLabel} to ${destinationLabel}`;

  return {
    type: "transport",
    title,
    description: "Flight · Check airlines for schedules and prices",
    startTime: label === "outbound" ? "7:00 AM" : "2:00 PM",
    duration: "3h",
  };
}

export async function enrichFlightItinerary(
  draft: ItineraryDraft,
  preferences: unknown,
  destination: string,
): Promise<ItineraryDraft> {
  if (isRoadTrip(preferences)) return draft;

  const startingLocation = getStartingLocation(preferences);
  if (!startingLocation || draft.days.length === 0) return draft;

  if (isLocalTrip(preferences, destination)) {
    return stripFlightItemsFromDraft(draft);
  }

  // Origin airport — nearest to the user's current location
  const originCoords = getLocationCoords(startingLocation);
  const originAirport = originCoords
    ? await findNearestAirport(originCoords.lat, originCoords.lng)
    : null;
  const originLabel = formatAirportLabel(originAirport, startingLocation.name);

  // Destination airport — prefer coordinates stored in preferences, fall back to text search
  const locations = getTripLocations(preferences);
  const destLocation = locations[0];
  const destCoords = destLocation ? getLocationCoords(destLocation) : null;
  const destAirport = destCoords
    ? await findNearestAirport(destCoords.lat, destCoords.lng)
    : await findAirportByDestination(destination);
  const destLabel = formatAirportLabel(destAirport, destination);

  if (
    originAirport?.iataCode &&
    destAirport?.iataCode &&
    originAirport.iataCode === destAirport.iataCode
  ) {
    return stripFlightItemsFromDraft(draft);
  }

  const days = draft.days
    .map((day) => ({ ...day, items: [...day.items] }))
    .sort((a, b) => a.dayNumber - b.dayNumber);

  const firstDay = days[0];
  const lastDay = days[days.length - 1];

  firstDay.items = stripLeadingFlightItems(firstDay.items);
  firstDay.items.unshift(buildFlightItem(originLabel, destLabel, "outbound"));

  lastDay.items = stripTrailingFlightItems(lastDay.items);
  lastDay.items.push(buildFlightItem(originLabel, destLabel, "return"));

  return { days };
}
