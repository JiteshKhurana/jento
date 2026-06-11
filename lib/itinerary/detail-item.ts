import type { ItineraryItemData } from "@/components/itinerary/day-timeline";
import type { TripIdeaData } from "@/components/ideas/idea-card";
import type { PlaceSearchResult } from "@/lib/places/google-places";

export function ideaToDetailItem(idea: TripIdeaData): ItineraryItemData {
  return {
    id: idea.id,
    type: idea.type,
    title: idea.title,
    description: idea.notes,
    sortOrder: 0,
    latitude: idea.latitude,
    longitude: idea.longitude,
    googlePlaceId: idea.googlePlaceId,
    placeCache: idea.placeCache,
  };
}

export function placeToDetailItem(place: PlaceSearchResult): ItineraryItemData {
  return {
    id: place.googlePlaceId,
    type: "ATTRACTION",
    title: place.name,
    sortOrder: 0,
    latitude: place.latitude,
    longitude: place.longitude,
    googlePlaceId: place.googlePlaceId,
    placeCache: {
      googlePlaceId: place.googlePlaceId,
      name: place.name,
      address: place.address,
      rating: place.rating,
      reviewCount: place.reviewCount,
    },
  };
}
