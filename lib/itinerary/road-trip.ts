import type { ActivityItem, ItineraryDraft } from "@/lib/ai/schemas";
import { getDrivingDuration } from "@/lib/places/directions";
import {
  getLocationCoords,
  getStartingLocation,
  getTripLocations,
  isRoadTrip,
  type TripLocationPreference,
} from "@/lib/trips/preferences";

function isDriveTransportItem(item: ActivityItem | undefined): boolean {
  if (!item || item.type !== "transport") return false;
  return /drive|road trip|driving/i.test(`${item.title} ${item.description ?? ""}`);
}

function stripLeadingDriveItems(items: ActivityItem[]): ActivityItem[] {
  const next = [...items];
  while (next.length > 0 && isDriveTransportItem(next[0])) {
    next.shift();
  }
  return next;
}

function stripTrailingDriveItems(items: ActivityItem[]): ActivityItem[] {
  const next = [...items];
  while (next.length > 0 && isDriveTransportItem(next[next.length - 1])) {
    next.pop();
  }
  return next;
}

async function buildDriveItem(
  origin: TripLocationPreference,
  destination: TripLocationPreference,
  label: "outbound" | "return",
): Promise<ActivityItem> {
  const originCoords = getLocationCoords(origin);
  const destinationCoords = getLocationCoords(destination);
  const routeStart = label === "return" ? destinationCoords : originCoords;
  const routeEnd = label === "return" ? originCoords : destinationCoords;
  const route =
    routeStart && routeEnd
      ? await getDrivingDuration(routeStart, routeEnd)
      : null;

  const title =
    label === "return"
      ? `Drive from ${destination.name} back to ${origin.name}`
      : `Drive from ${origin.name} to ${destination.name}`;

  const description = route
    ? route.distanceText
      ? `Road trip · ~${route.durationText} driving · ${route.distanceText}`
      : `Road trip · ~${route.durationText} driving`
    : "Road trip driving leg";

  return {
    type: "transport",
    title,
    description,
    duration: route?.durationText,
    latitude: routeEnd?.lat,
    longitude: routeEnd?.lng,
  };
}

export async function enrichRoadTripItinerary(
  draft: ItineraryDraft,
  preferences: unknown,
): Promise<ItineraryDraft> {
  if (!isRoadTrip(preferences)) return draft;

  const locations = getTripLocations(preferences);
  const startingLocation = getStartingLocation(preferences);
  if (locations.length === 0 || draft.days.length === 0) return draft;
  if (!startingLocation && locations.length < 2) return draft;

  const firstStop = locations[0];
  const lastStop = locations[locations.length - 1];
  const outboundOrigin = startingLocation ?? firstStop;
  const outboundDestination =
    startingLocation != null
      ? firstStop
      : locations.length === 2
        ? lastStop
        : locations[1];
  const returnDestination = startingLocation ?? firstStop;

  const days = draft.days
    .map((day) => ({ ...day, items: [...day.items] }))
    .sort((a, b) => a.dayNumber - b.dayNumber);

  const firstDay = days[0];
  const lastDay = days[days.length - 1];

  firstDay.items = stripLeadingDriveItems(firstDay.items);
  firstDay.items.unshift(
    await buildDriveItem(outboundOrigin, outboundDestination, "outbound"),
  );

  lastDay.items = stripTrailingDriveItems(lastDay.items);
  lastDay.items.push(
    await buildDriveItem(returnDestination, lastStop, "return"),
  );

  return { days };
}
