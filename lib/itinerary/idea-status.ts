import type { TripIdeaData } from "@/components/ideas/idea-card";
import type { ItineraryDayData } from "@/components/itinerary/day-timeline";
import { toStoragePlaceId } from "@/lib/places/utils";

function normalizePlaceId(id: string | null | undefined): string | null {
  if (!id) return null;
  return toStoragePlaceId(id);
}

export function isIdeaInItinerary(
  idea: TripIdeaData,
  days: ItineraryDayData[],
): boolean {
  const items = days.flatMap((day) => day.items);
  const ideaPlaceId = normalizePlaceId(idea.googlePlaceId);

  return items.some((item) => {
    const itemPlaceId = normalizePlaceId(
      item.googlePlaceId ?? item.placeCache?.googlePlaceId,
    );
    if (ideaPlaceId && itemPlaceId) {
      return ideaPlaceId === itemPlaceId;
    }
    return (
      item.title.trim().toLowerCase() === idea.title.trim().toLowerCase()
    );
  });
}

export function getAddedIdeaIds(
  ideas: TripIdeaData[],
  days: ItineraryDayData[],
): Set<string> {
  return new Set(
    ideas.filter((idea) => isIdeaInItinerary(idea, days)).map((idea) => idea.id),
  );
}
